import logging
from functools import lru_cache
from typing import Dict, List

from transformers import pipeline

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_sentiment_pipeline():
    try:
        return pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment-latest")
    except Exception as exc:
        logger.warning("Sentiment model unavailable; falling back to rule-based sentiment: %s", exc)
        return None


def _fallback_sentiment(texts: List[str]) -> Dict[str, int]:
    summary = {"positive": 0, "neutral": 0, "negative": 0}
    negative_markers = {"no", "not", "delay", "issue", "problem", "water", "complaint", "failed", "broken"}
    for text in texts:
        lowered = text.lower()
        if any(token in lowered for token in negative_markers):
            summary["negative"] += 1
        elif any(token in lowered for token in {"thanks", "resolved", "good", "fixed"}):
            summary["positive"] += 1
        else:
            summary["neutral"] += 1
    return summary


def analyze_sentiments(texts: List[str]) -> Dict[str, int]:
    if not texts:
        return {"positive": 0, "neutral": 0, "negative": 0}

    classifier = get_sentiment_pipeline()
    if classifier is None:
        return _fallback_sentiment(texts[:128])

    try:
        results = classifier(texts[:128], truncation=True)
    except Exception as exc:
        logger.warning("Sentiment inference failed; using fallback: %s", exc)
        return _fallback_sentiment(texts[:128])

    summary = {"positive": 0, "neutral": 0, "negative": 0}
    for row in results:
        label = row["label"].lower()
        if "neg" in label:
            summary["negative"] += 1
        elif "neu" in label:
            summary["neutral"] += 1
        else:
            summary["positive"] += 1
    return summary
