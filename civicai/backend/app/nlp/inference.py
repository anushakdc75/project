import logging
from typing import Dict, List

from .embedder import detect_language, embed_query
from .faiss_index import search
from .translate import from_english, to_english

logger = logging.getLogger(__name__)


def infer_response(query: str, index, records: List[Dict], top_k: int = 5) -> Dict:
    if not query.strip():
        raise ValueError("query must not be empty")
    if index.ntotal == 0 or not records:
        raise RuntimeError("AI index is empty; cannot run inference")

    lang = detect_language(query)
    english_query = to_english(query) if lang != "en" else query

    qvec = embed_query(english_query)
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

    best_idx = int(ids[0]) if len(ids) and int(ids[0]) >= 0 else 0
    best = records[best_idx]

    solution_steps = [
        best["solution"],
        "Share complaint evidence (photos, dates, location landmarks) with the department helpdesk.",
        f"If unresolved in {best.get('resolution_days', 5)} days, reply with NOT SOLVED for auto-escalation.",
    ]

    english_reply = (
        f"Best matched department: {best['department']}. "
        f"Recommended immediate action: {solution_steps[0]}"
    )
    localized_reply = from_english(english_reply, lang)
    localized_steps = [from_english(step, lang) for step in solution_steps]

    raw_conf = float(scores[0]) if len(scores) else 0.0
    confidence = max(0.0, min(1.0, raw_conf))
    logger.info("Inference success lang=%s department=%s confidence=%.3f", lang, best["department"], confidence)

    return {
        "reply": localized_reply,
        "answer": localized_reply,
        "solution_steps": localized_steps,
        "confidence": round(confidence, 3),
        "department": best["department"],
        "expected_resolution_time": f"{best.get('resolution_days', 5)} days",
        "similar_cases": similar_cases,
    }
