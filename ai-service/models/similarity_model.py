"""
Semantic duplicate/similarity detection using sentence embeddings.

Given a new problem's text and a list of existing problems (id + text) supplied
by the backend, this computes cosine similarity between the new text and each
existing one, using real embeddings rather than exact string matching.
"""

from sentence_transformers import SentenceTransformer, util

_model = None


def _get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def find_similar_problems(new_text: str, existing_problems: list, top_k: int = 5):
    """
    existing_problems: list of dicts like {"id": "...", "text": "..."}
    Returns a list of {"id", "similarity"} sorted by similarity descending,
    limited to top_k.
    """
    if not existing_problems:
        return []

    model = _get_model()
    new_embedding = model.encode(new_text, convert_to_tensor=True)

    texts = [p["text"] for p in existing_problems]
    embeddings = model.encode(texts, convert_to_tensor=True)

    scores = util.cos_sim(new_embedding, embeddings)[0]

    results = [
        {
            "id": existing_problems[i]["id"],
            "similarity": round(float(scores[i]), 4)
        }
        for i in range(len(existing_problems))
    ]

    results.sort(key=lambda r: r["similarity"], reverse=True)

    return results[:top_k]
