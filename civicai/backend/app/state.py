from dataclasses import dataclass
from functools import lru_cache

from .nlp.faiss_index import load_or_create_index
from .nlp.inference import infer_response


@dataclass
class AIState:
    index: object
    records: list

    def run_inference(self, query: str):
        return infer_response(query, self.index, self.records)


@lru_cache(maxsize=1)
def get_ai_state() -> AIState:
    index, records = load_or_create_index()
    return AIState(index=index, records=records)
