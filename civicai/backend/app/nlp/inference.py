from typing import Dict, List

from .embedder import detect_language, embed_query
from .faiss_index import search
from .translate import from_english, to_english


def infer_response(query: str, index, records: List[Dict], top_k: int = 5) -> Dict:
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
                "similarity": round(float(score), 4),
            }
        )

    best = records[ids[0]] if len(ids) and ids[0] >= 0 else {
        "department": "General Administration",
        "solution": "Your request has been recorded.",
        "resolution_days": 5,
    }

    answer = (
        "Recommended resolution steps:\n"
        f"1) {best['solution']}\n"
        "2) Keep your documents and complaint evidence ready.\n"
        f"3) If unresolved in {best.get('resolution_days', 5)} days, reply with NOT SOLVED for auto-escalation."
    )

    localized_answer = from_english(answer, lang)
    confidence = max(0.0, min(1.0, float(scores[0]) if len(scores) else 0.45))

    return {
        "answer": localized_answer,
        "confidence": round(confidence, 3),
        "department": best["department"],
        "expected_resolution_time": f"{best.get('resolution_days', 5)} days",
        "similar_cases": similar_cases,
    }
