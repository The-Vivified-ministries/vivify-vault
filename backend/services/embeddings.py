from functools import lru_cache
from sentence_transformers import SentenceTransformer
from config import settings


@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    # Loaded once per process and cached. On Render's free tier this load
    # happens on cold start (after idle spin-down) and takes a few seconds
    # — see the architecture notes on cold-start latency.
    return SentenceTransformer(settings.EMBEDDING_MODEL)


def embed_text(text: str) -> list[float]:
    model = get_model()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()


def embed_texts(texts: list[str]) -> list[list[float]]:
    model = get_model()
    vectors = model.encode(texts, normalize_embeddings=True, batch_size=32)
    return [v.tolist() for v in vectors]
