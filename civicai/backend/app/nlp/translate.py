from functools import lru_cache

from googletrans import Translator


@lru_cache(maxsize=1)
def get_translator() -> Translator:
    return Translator()


def to_english(text: str) -> str:
    try:
        translated = get_translator().translate(text, dest="en")
        return translated.text
    except Exception:
        return text


def from_english(text: str, target_lang: str) -> str:
    if target_lang == "en":
        return text
    try:
        translated = get_translator().translate(text, dest=target_lang)
        return translated.text
    except Exception:
        return text
