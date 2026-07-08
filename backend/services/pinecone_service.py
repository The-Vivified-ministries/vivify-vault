from pinecone import Pinecone, ServerlessSpec
from config import settings

_pc: Pinecone | None = None


def get_client() -> Pinecone:
    global _pc
    if _pc is None:
        _pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    return _pc


def get_index():
    pc = get_client()
    existing = [idx["name"] for idx in pc.list_indexes()]
    if settings.PINECONE_INDEX_NAME not in existing:
        pc.create_index(
            name=settings.PINECONE_INDEX_NAME,
            dimension=settings.EMBEDDING_DIM,
            metric="cosine",
            spec=ServerlessSpec(
                cloud=settings.PINECONE_CLOUD, region=settings.PINECONE_REGION
            ),
        )
    return pc.Index(settings.PINECONE_INDEX_NAME)


def fetch_existing_hashes(ids: list[str]) -> dict[str, str]:
    """Returns {id: content_hash} for whichever of the given ids already
    exist in the index. Used to skip re-embedding unchanged rows."""
    if not ids:
        return {}
    index = get_index()
    result = {}
    # Pinecone fetch has a batch limit; chunk defensively.
    for i in range(0, len(ids), 100):
        batch = ids[i : i + 100]
        res = index.fetch(ids=batch)
        for vec_id, vec in res.vectors.items():
            result[vec_id] = vec.metadata.get("content_hash", "")
    return result


def upsert_sermons(items: list[dict]) -> None:
    """items: [{id, values, metadata}, ...]"""
    if not items:
        return
    index = get_index()
    for i in range(0, len(items), 100):
        index.upsert(vectors=items[i : i + 100])


def query_sermons(vector: list[float], top_k: int = 3) -> list[dict]:
    index = get_index()
    res = index.query(vector=vector, top_k=top_k, include_metadata=True)
    return [
        {"id": m.id, "score": m.score, "metadata": m.metadata} for m in res.matches
    ]
