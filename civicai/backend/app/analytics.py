from collections import Counter, defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from .database import get_db
from .models import Complaint
from .nlp.sentiment import analyze_sentiments
from .nlp.topic_model import extract_topics

router = APIRouter(tags=["analytics"])


@router.get("/analytics")
def analytics(db: Session = Depends(get_db)):
    rows = db.query(Complaint).all()
    total = len(rows)
    open_cases = sum(1 for r in rows if r.status in {"open", "escalated"})
    resolved = sum(1 for r in rows if r.status == "resolved")
    avg_sla = float(sum(r.sla_hours for r in rows) / total) if total else 0.0
    distribution = dict(Counter(r.department for r in rows))

    sentiments = analyze_sentiments([r.text for r in rows]) if rows else {"positive": 0, "neutral": 0, "negative": 0}

    return {
        "total_complaints": total,
        "open_cases": open_cases,
        "resolved_cases": resolved,
        "avg_sla_hours": round(avg_sla, 2),
        "department_distribution": distribution,
        "sentiment_distribution": sentiments,
    }


@router.get("/topics")
def topics(db: Session = Depends(get_db)):
    rows = db.query(Complaint).all()
    return extract_topics([r.text for r in rows], n_topics=8)


@router.get("/alerts")
def alerts(db: Session = Depends(get_db)):
    cutoff = datetime.utcnow() - timedelta(days=7)
    rows = db.query(Complaint).filter(Complaint.created_at >= cutoff).all()

    group = defaultdict(int)
    for row in rows:
        key = (row.department, row.location or "Unknown")
        group[key] += 1

    alerts = []
    for (department, location), issue_count in group.items():
        if issue_count >= 3:
            severity = "high" if issue_count >= 7 else "medium"
            alerts.append(
                {
                    "department": department,
                    "location": location,
                    "issue_count": issue_count,
                    "severity": severity,
                }
            )
    return alerts
