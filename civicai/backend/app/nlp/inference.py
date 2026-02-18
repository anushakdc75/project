import logging
from typing import Dict, List

import numpy as np

from .embedder import detect_language, embed_query
from .faiss_index import search
from .translate import from_english, to_english

logger = logging.getLogger(__name__)


def _predict_department(query_vector: np.ndarray, department_profiles: Dict[str, np.ndarray]) -> str | None:
    if not department_profiles:
        return None

    best_department = None
    best_score = -1.0
    for department, profile in department_profiles.items():
        score = float(np.dot(query_vector, profile))
        if score > best_score:
            best_department = department
            best_score = score
    return best_department


def _pick_best_record(ids, scores, records, preferred_department: str | None):
    for idx, score in zip(ids, scores):
        if idx < 0 or idx >= len(records):
            continue
        item = records[idx]
        if preferred_department and item["department"] == preferred_department:
            return item, float(score)

    first_idx = int(ids[0]) if len(ids) and int(ids[0]) >= 0 else 0
    first_score = float(scores[0]) if len(scores) else 0.0
    return records[first_idx], first_score


def infer_response(query: str, index, records: List[Dict], department_profiles: Dict[str, np.ndarray], top_k: int = 8) -> Dict:
    if not query.strip():
        raise ValueError("query must not be empty")
    if index.ntotal == 0 or not records:
        raise RuntimeError("AI index is empty; cannot run inference")

    lang = detect_language(query)
    english_query = to_english(query) if lang != "en" else query

    qvec = embed_query(english_query)
    predicted_department = _predict_department(qvec, department_profiles)

    scores, ids = search(index, qvec, top_k=top_k)

    similar_cases = []
    for score, idx in zip(scores, ids):
        if idx < 0 or idx >= len(records):
            continue
        item = records[idx]
        similar_cases.append(
            {
                "grievance_id": item["id"],
                "department": item["department"],
                "solution": from_english(item["solution"], lang),
                "similarity": round(float(max(0.0, score)), 4),
            }
        )

    best, raw_conf = _pick_best_record(ids, scores, records, predicted_department)
    confidence = max(0.0, min(1.0, raw_conf))

    solution_steps = [
        from_english(best["solution"], lang),
        from_english(f"Use complaint category: {best['department']} and attach photos/documents as proof.", lang),
        from_english(f"Expected first action within {best.get('resolution_days', 5)} days. Reply NOT SOLVED to escalate.", lang),
    ]

    if confidence < 0.35:
        english_reply = (
            "I need a little more detail (area + exact civic issue). I will then route it to the correct department "
            "and provide an exact resolution path."
        )
    else:
        english_reply = (
            f"This looks like a {best['department']} issue. I matched your complaint with similar resolved cases "
            f"and selected the department-specific solution."
        )

    localized_reply = from_english(english_reply, lang)
    logger.info(
        "Inference success lang=%s predicted=%s selected=%s confidence=%.3f",
        lang,
        predicted_department,
        best["department"],
        confidence,
    )

    return {
        "reply": localized_reply,
        "answer": localized_reply,
        "solution_steps": solution_steps,
        "confidence": round(confidence, 3),
        "department": best["department"],
        "expected_resolution_time": f"{best.get('resolution_days', 5)} days",
        "similar_cases": similar_cases,
        "escalation_note": "No escalation yet. Type NOT SOLVED if the issue is unresolved.",
        "is_live_authority_contact": False,
    }
