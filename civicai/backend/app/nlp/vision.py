import io
from functools import lru_cache
from typing import Tuple

from PIL import Image
from transformers import pipeline

LABEL_TO_DEPARTMENT = {
    "garbage dump": "Solid Waste Management",
    "overflowing bin": "Solid Waste Management",
    "sewage leakage": "Drainage and Sewerage",
    "water pipe leak": "Water Board",
    "broken road": "Roads and Infrastructure",
    "pothole": "Roads and Infrastructure",
    "streetlight outage": "Electrical Department",
}


@lru_cache(maxsize=1)
def get_zero_shot_vision():
    try:
        return pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32")
    except Exception:
        return None


def detect_issue_from_image(image_bytes: bytes) -> Tuple[str, str, float]:
    model = get_zero_shot_vision()
    if model is None:
        return "unclassified civic issue", "General Administration", 0.0

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    labels = list(LABEL_TO_DEPARTMENT.keys())
    result = model(image, candidate_labels=labels)
    best = result[0]
    issue = best["label"]
    score = float(best["score"])
    return issue, LABEL_TO_DEPARTMENT.get(issue, "General Administration"), round(score, 3)
