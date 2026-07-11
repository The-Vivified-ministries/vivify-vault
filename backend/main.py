from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models import (
    ChatRequest,
    ChatResponse,
    SearchResult,
    SermonOut,
    ToggleRequest,
    SyncResult,
)
from services import embeddings, pinecone_service, groq_service, sync_service, db_queries

app = FastAPI(title="Vivify Vault API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _check_admin(x_admin_key: str | None):
    if x_admin_key != settings.ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Invalid admin key")


def _coerce_int(value: object, fallback: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


@app.get("/health")
def health():
    return {"status": "ok", "llm_enabled": groq_service.is_enabled()}


@app.get("/categories", response_model=list[str])
def categories():
    return db_queries.get_all_categories()


@app.get("/categories/{category}/subcategories", response_model=list[str])
def subcategories(category: str):
    return db_queries.get_subcategories(category)


@app.get("/years", response_model=list[int])
def years():
    return db_queries.get_years()


@app.get("/sermons", response_model=list[SermonOut])
def sermons(
    category: str | None = None,
    subcategory: str | None = None,
    year: int | None = None,
):
    rows = db_queries.get_sermons(category, subcategory, year)
    return [SermonOut(**r.dict()) for r in rows]


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    vector = embeddings.embed_text(req.query)
    matches = pinecone_service.query_sermons(vector, top_k=req.top_k)

    sermons_for_llm = [
        {
            "title": m["metadata"]["title"],
            "categories": m["metadata"].get("categories", []),
            "description": m["metadata"]["description"],
            "link": m["metadata"].get("spotify_link")
            or m["metadata"].get("apple_music_link", ""),
        }
        for m in matches
    ]
    answer = groq_service.generate_recommendation(req.query, sermons_for_llm)

    results = [
        SearchResult(
            id=m["id"],
            score=m["score"],
            sermon=SermonOut(
                id=_coerce_int(m["id"]),
                title=m["metadata"]["title"],
                year=m["metadata"].get("year") or None,
                categories=m["metadata"].get("categories", []),
                subcategories=m["metadata"].get("subcategories", []),
                description=m["metadata"]["description"],
                spotify_link=m["metadata"].get("spotify_link") or None,
                apple_music_link=m["metadata"].get("apple_music_link") or None,
            ),
        )
        for m in matches
    ]
    return ChatResponse(answer=answer, llm_used=groq_service.is_enabled(), results=results)


@app.post("/admin/sync", response_model=SyncResult)
def admin_sync(x_admin_key: str | None = Header(default=None)):
    _check_admin(x_admin_key)
    result = sync_service.run_sync()
    return SyncResult(**result)


@app.post("/admin/toggle-llm")
def admin_toggle_llm(
    body: ToggleRequest, x_admin_key: str | None = Header(default=None)
):
    _check_admin(x_admin_key)
    groq_service.set_enabled(body.enabled)
    return {"llm_enabled": groq_service.is_enabled()}
