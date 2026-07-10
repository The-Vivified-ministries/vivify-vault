from functools import lru_cache
from fastembed import TextEmbedding
from config import settings


@lru_cache(maxsize=1)
def get_model() -> TextEmbedding:
    # fastembed uses ONNX runtime under the hood — no PyTorch dependency,
    # which matters a lot on Render's free tier: full sentence-transformers
    # + torch can approach or exceed the 512MB RAM ceiling on its own,
    # before FastAPI/pandas/uvicorn overhead is even counted. fastembed's
    # footprint is a fraction of that, comfortably within the free tier.
    return TextEmbedding(model_name=settings.EMBEDDING_MODEL)


def embed_text(text: str) -> list[float]:
    model = get_model()
    vector = next(model.embed([text]))
    return vector.tolist()


def embed_texts(texts: list[str]) -> list[list[float]]:
    model = get_model()
    vectors = model.embed(texts)
    return [v.tolist() for v in vectors]
