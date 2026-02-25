from __future__ import annotations

import hashlib
import json
import logging
from pathlib import Path
from typing import Dict, List, Tuple

import faiss
import numpy as np
import pandas as pd

from .embedder import embed_documents

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_FILE = BASE_DIR / "data" / "bbmp_reddit_data.csv"
INDEX_FILE = BASE_DIR / "data" / "grievance.index"
META_FILE = BASE_DIR / "data" / "grievance_meta.json"
FINGERPRINT_FILE = BASE_DIR / "data" / "grievance_fingerprint.txt"


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.rename(columns={c: c.lower() for c in df.columns})
    required = ["text", "department", "solution", "location", "resolution_days"]
    for needed in required:
        if needed not in df.columns:
            df[needed] = ""
    df["id"] = df.index.astype(str)
    return df


def _dataset_fingerprint() -> str:
    stat = DATA_FILE.stat()
    payload = f"{DATA_FILE.name}:{stat.st_size}:{stat.st_mtime_ns}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _safe_resolution_days(value) -> int:
    try:
        day_count = int(float(value))
        return day_count if day_count > 0 else 5
    except (TypeError, ValueError):
        return 5


def _build_records(df: pd.DataFrame) -> List[Dict]:
    records: List[Dict] = []
    for _, row in df.iterrows():
        text = str(row.get("text", "")).strip()
        if not text:
            continue
        department = str(row.get("department", "")).strip() or "General Administration"
        location = str(row.get("location", "")).strip() or "Unknown"
        solution = str(row.get("solution", "")).strip() or (
            "Your complaint has been registered. Contact the department office with complaint evidence "
            "and request an inspection timeline."
        )

        records.append(
            {
                "id": str(row.get("id", len(records))),
                "text": text,
                "department": department,
                "solution": solution,
                "location": location,
                "resolution_days": _safe_resolution_days(row.get("resolution_days", 5)),
            }
        )
    return records


def _build_index(records: List[Dict]) -> faiss.IndexFlatIP:
    vectors = embed_documents([row["text"] for row in records])
    dim = vectors.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(vectors)

    faiss.write_index(index, str(INDEX_FILE))
    META_FILE.write_text(json.dumps(records, ensure_ascii=False), encoding="utf-8")
    FINGERPRINT_FILE.write_text(_dataset_fingerprint(), encoding="utf-8")
    logger.info("FAISS index built and persisted with %s records", len(records))
    return index


def _load_cached_index() -> Tuple[faiss.Index, List[Dict]]:
    index = faiss.read_index(str(INDEX_FILE))
    records = json.loads(META_FILE.read_text(encoding="utf-8"))
    return index, records


def load_or_create_index() -> Tuple[faiss.Index, List[Dict]]:
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"Dataset missing at {DATA_FILE}")

    dataset_fp = _dataset_fingerprint()
    has_cache = INDEX_FILE.exists() and META_FILE.exists() and FINGERPRINT_FILE.exists()

    if has_cache:
        cached_fp = FINGERPRINT_FILE.read_text(encoding="utf-8").strip()
        if cached_fp == dataset_fp:
            index, records = _load_cached_index()
            if index.ntotal and len(records) == index.ntotal:
                logger.info("Loaded persisted FAISS index with %s records", len(records))
                return index, records
            logger.warning("Cached FAISS metadata mismatch (records=%s index=%s); rebuilding", len(records), index.ntotal)
        else:
            logger.info("Dataset changed, rebuilding FAISS index")

    df = _normalize_columns(pd.read_csv(DATA_FILE).fillna(""))
    records = _build_records(df)
    if not records:
        raise ValueError("No non-empty grievance text rows found in dataset")

    index = _build_index(records)
    return index, records


def search(index: faiss.Index, query_vector: np.ndarray, top_k: int = 5):
    query_vector = np.expand_dims(query_vector, axis=0)
    top_k = max(1, min(top_k, index.ntotal))
    scores, ids = index.search(query_vector, top_k)
    return scores[0], ids[0]
