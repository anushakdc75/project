from collections import Counter
from typing import Dict, List

from sklearn.cluster import MiniBatchKMeans

from .embedder import embed_documents


def extract_topics(texts: List[str], n_topics: int = 6) -> List[Dict]:
    if not texts:
        return []

    n_clusters = min(n_topics, max(1, len(texts)))
    vectors = embed_documents(texts)
    model = MiniBatchKMeans(n_clusters=n_clusters, random_state=42, n_init="auto")
    labels = model.fit_predict(vectors)
    counts = Counter(labels)

    topics = []
    for label, size in counts.most_common():
        representative = next(texts[i] for i, l in enumerate(labels) if l == label)
        topics.append({"topic_id": int(label), "size": int(size), "representative_text": representative[:180]})
    return topics
