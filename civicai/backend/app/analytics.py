from collections import Counter, defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .database import get_db
from .models import Complaint
from .nlp.sentiment import analyze_sentiments
from .nlp.topic_model import extract_topics
from .schemas import AnalyticsResponse
from .state import get_ai_state

router = APIRouter(tags=["analytics"])


def _base_rows(db: Session):
    complaint_rows = db.query(Complaint).all()
    if complaint_rows:
        return complaint_rows, False

    ai_state = get_ai_state()
    synthetic = [
        {
            "text": rec["text"],
            "department": rec["department"],
            "location": rec.get("location", "Unknown") or "Unknown",
            "status": "open",
            "sla_hours": 72,
            "created_at": datetime.utcnow(),
        }
        for rec in ai_state.records[:2000]
    ]
    return synthetic, True


@router.get("/analytics", response_model=AnalyticsResponse)
def analytics(db: Session = Depends(get_db)):
    rows, synthetic = _base_rows(db)
    total = len(rows)

    def getv(row, name, default=None):
        if isinstance(row, dict):
            return row.get(name, default)
        return getattr(row, name, default)

    open_cases = sum(1 for r in rows if getv(r, "status", "open") in {"open", "escalated"})
    resolved = sum(1 for r in rows if getv(r, "status", "") == "resolved")
    breached = sum(1 for r in rows if int(getv(r, "sla_hours", 0) or 0) > 72 and getv(r, "status", "") != "resolved")
    avg_sla = float(sum(int(getv(r, "sla_hours", 72) or 72) for r in rows) / total) if total else 0.0

    by_location = defaultdict(list)
    department_counter = Counter()
    for row in rows:
        location = str(getv(row, "location", "Unknown") or "Unknown")
        department = str(getv(row, "department", "General Administration") or "General Administration")
        by_location[location].append(department)
        department_counter[department] += 1

    area_clusters = []
    for location, departments in sorted(by_location.items(), key=lambda kv: len(kv[1]), reverse=True)[:15]:
        dominant_department = Counter(departments).most_common(1)[0][0]
        area_clusters.append(
            {
                "location": location,
                "complaint_count": len(departments),
                "dominant_department": dominant_department,
            }
        )

    week_cutoff = datetime.utcnow() - timedelta(days=7)
    recent = [r for r in rows if getv(r, "created_at", datetime.utcnow()) >= week_cutoff]
    alerts_group = defaultdict(list)
    for row in recent:
        key = (str(getv(row, "location", "Unknown") or "Unknown"), str(getv(row, "department", "General Administration") or "General Administration"))
        alerts_group[key].append(str(getv(row, "text", "")))

    emerging_alerts = []
    for (location, department), texts in alerts_group.items():
        if len(texts) < 3 and not synthetic:
            continue
        sentiments = analyze_sentiments(texts[:128])
        negative = sentiments.get("negative", 0)
        sentiment_spike = "high" if negative >= max(3, len(texts) * 0.5) else "moderate"
        severity = "high" if len(texts) >= 8 else "medium" if len(texts) >= 4 else "low"
        emerging_alerts.append(
            {
                "location": location,
                "department": department,
                "complaint_count": len(texts),
                "sentiment_spike": sentiment_spike,
                "severity": severity,
            }
        )

    emerging_alerts.sort(key=lambda x: (x["severity"], x["complaint_count"]), reverse=True)

    sentiment_distribution = analyze_sentiments([str(getv(r, "text", "")) for r in rows[:512]]) if rows else {"positive": 0, "neutral": 0, "negative": 0}

    return {
        "sla_summary": {
            "total_complaints": total,
            "open_cases": open_cases,
            "resolved_cases": resolved,
            "sla_breaches": breached,
            "avg_sla_hours": round(avg_sla, 2),
            "source": "complaints" if not synthetic else "dataset_bootstrap",
        },
        "complaint_volume": {
            "total": total,
            "by_department": dict(department_counter.most_common(12)),
        },
        "area_clusters": area_clusters,
        "emerging_alerts": emerging_alerts[:20],
        "sentiment_distribution": sentiment_distribution,
    }


@router.get("/topics")
def topics(db: Session = Depends(get_db)):
    rows, _ = _base_rows(db)
    texts = [row["text"] if isinstance(row, dict) else row.text for row in rows]
    return extract_topics(texts, n_topics=8)


@router.get("/alerts")
def alerts(db: Session = Depends(get_db)):
    data = analytics(db)
    return data["emerging_alerts"]
