from functools import lru_cache
from typing import List

import numpy as np
from langdetect import detect
from sentence_transformers import SentenceTransformer

SUPPORTED_LANGS = {"hi", "kn", "ta", "te", "mr", "bn", "en"}


@lru_cache(maxsize=1)
def get_embedder() -> SentenceTransformer:
    return SentenceTransformer("intfloat/e5-base-v2")


def _format_e5(texts: List[str], prefix: str) -> List[str]:
    return [f"{prefix}: {text.strip()}" for text in texts]


def detect_language(text: str) -> str:
    try:
        lang = detect(text)
        return lang if lang in SUPPORTED_LANGS else "en"
    except Exception:
        return "en"


def embed_documents(texts: List[str]) -> np.ndarray:
    model = get_embedder()
    vectors = model.encode(_format_e5(texts, "passage"), normalize_embeddings=True)
    return np.array(vectors, dtype="float32")


def embed_query(query: str) -> np.ndarray:
    model = get_embedder()
    vector = model.encode(_format_e5([query], "query"), normalize_embeddings=True)[0]
    return np.array(vector, dtype="float32")
