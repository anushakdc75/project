from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Tuple

import faiss
import numpy as np
import pandas as pd

from .embedder import embed_documents

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_FILE = BASE_DIR / "data" / "bbmp_reddit_data.csv"
INDEX_FILE = BASE_DIR / "data" / "grievance.index"
META_FILE = BASE_DIR / "data" / "grievance_meta.json"


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.rename(columns={c: c.lower() for c in df.columns})
    for needed in ["text", "department", "solution", "location"]:
        if needed not in df.columns:
            df[needed] = ""
    df["id"] = df.index.astype(str)
    return df


def _build_index(records: List[Dict]) -> faiss.IndexFlatIP:
    vectors = embed_documents([row["text"] for row in records])
    dim = vectors.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(vectors)
    faiss.write_index(index, str(INDEX_FILE))
    META_FILE.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    return index


def load_or_create_index() -> Tuple[faiss.Index, List[Dict]]:
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"Dataset missing at {DATA_FILE}")

    if INDEX_FILE.exists() and META_FILE.exists():
        index = faiss.read_index(str(INDEX_FILE))
        records = json.loads(META_FILE.read_text(encoding="utf-8"))
        return index, records

    df = _normalize_columns(pd.read_csv(DATA_FILE).fillna(""))
    records = [
        {
            "id": row["id"],
            "text": str(row["text"]),
            "department": str(row["department"] or "General Administration"),
            "solution": str(row["solution"] or "Your complaint has been registered and assigned for verification."),
            "location": str(row["location"] or "Unknown"),
            "resolution_days": int(row.get("resolution_days", 5) or 5),
        }
        for _, row in df.iterrows()
        if str(row["text"]).strip()
    ]

    index = _build_index(records)
    return index, records


def search(index: faiss.Index, query_vector: np.ndarray, top_k: int = 5):
    query_vector = np.expand_dims(query_vector, axis=0)
    scores, ids = index.search(query_vector, top_k)
    return scores[0], ids[0]
