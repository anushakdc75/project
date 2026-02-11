from functools import lru_cache
from typing import Dict, List

from transformers import pipeline


@lru_cache(maxsize=1)
def get_sentiment_pipeline():
    return pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment-latest")


def analyze_sentiments(texts: List[str]) -> Dict[str, int]:
    if not texts:
        return {"positive": 0, "neutral": 0, "negative": 0}
    classifier = get_sentiment_pipeline()
    results = classifier(texts[:128], truncation=True)
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
