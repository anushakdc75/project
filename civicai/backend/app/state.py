from dataclasses import dataclass
from functools import lru_cache
from typing import Dict, List

import numpy as np

from .nlp.embedder import embed_documents
from .nlp.faiss_index import load_or_create_index
from .nlp.inference import infer_response


@dataclass
class AIState:
    index: object
    records: list
    department_profiles: Dict[str, np.ndarray]

    def run_inference(self, query: str):
        return infer_response(query, self.index, self.records, self.department_profiles)


def _build_department_profiles(records: List[dict]) -> Dict[str, np.ndarray]:
    grouped: Dict[str, List[str]] = {}
    for row in records:
        dept = row.get("department") or "General Administration"
        grouped.setdefault(dept, []).append(row.get("text", ""))

    profiles: Dict[str, np.ndarray] = {}
    for dept, texts in grouped.items():
        samples = texts[:80]
        if not samples:
            continue
        vecs = embed_documents(samples)
        centroid = vecs.mean(axis=0)
        norm = np.linalg.norm(centroid)
        profiles[dept] = centroid / norm if norm > 0 else centroid
    return profiles


@lru_cache(maxsize=1)
def get_ai_state() -> AIState:
    index, records = load_or_create_index()
    department_profiles = _build_department_profiles(records)
    return AIState(index=index, records=records, department_profiles=department_profiles)
