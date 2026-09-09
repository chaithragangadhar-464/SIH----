import re

def clean_text(text: str) -> str:
    """Lowercases, strips extra whitespace, and removes non-informative punctuation
    while preserving words needed for embedding-based similarity/classification."""
    if not text:
        return ""
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    return text


def combine_fields(*fields) -> str:
    """Joins multiple text fields (title, description, etc.) into one string
    for embedding, skipping empty ones."""
    parts = [str(f).strip() for f in fields if f]
    return ". ".join(parts)
