from fastapi import FastAPI, UploadFile, File, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models import ChatRequest, ChatResponse, SearchResult, SermonMetadata, ToggleRequest, SyncResult
from services import embeddings, pinecone_service, groq_service, sync_service

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


@app.get("/health")
def health():
    return {"status": "ok", "llm_enabled": groq_service.is_enabled()}


@app.get("/sermons", response_model=list[SermonMetadata])
def list_sermons(category: str | None = None):
    sermons = sync_service.load_cached_sermons()
    if category:
        sermons = [s for s in sermons if s["category"].lower() == category.lower()]
    return [SermonMetadata(**s) for s in sermons]


@app.get("/categories", response_model=list[str])
def list_categories():
    sermons = sync_service.load_cached_sermons()
    return sorted({s["category"] for s in sermons})


@app.get("/search", response_model=list[SearchResult])
def search(q: str, top_k: int = 5):
    vector = embeddings.embed_text(q)
    matches = pinecone_service.query_sermons(vector, top_k=top_k)
    return [
        SearchResult(
            id=m["id"],
            score=m["score"],
            sermon=SermonMetadata(
                title=m["metadata"]["title"],
                category=m["metadata"]["category"],
                speaker=m["metadata"].get("speaker") or None,
                link=m["metadata"]["link"],
                description=m["metadata"]["description"],
            ),
        )
        for m in matches
    ]


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    vector = embeddings.embed_text(req.query)
    matches = pinecone_service.query_sermons(vector, top_k=req.top_k)

    sermons_for_llm = [
        {
            "title": m["metadata"]["title"],
            "category": m["metadata"]["category"],
            "description": m["metadata"]["description"],
            "link": m["metadata"]["link"],
        }
        for m in matches
    ]

    answer = groq_service.generate_recommendation(req.query, sermons_for_llm)

    results = [
        SearchResult(
            id=m["id"],
            score=m["score"],
            sermon=SermonMetadata(
                title=m["metadata"]["title"],
                category=m["metadata"]["category"],
                speaker=m["metadata"].get("speaker") or None,
                link=m["metadata"]["link"],
                description=m["metadata"]["description"],
            ),
        )
        for m in matches
    ]

    return ChatResponse(
        answer=answer, llm_used=groq_service.is_enabled(), results=results
    )


@app.post("/admin/sync", response_model=SyncResult)
async def admin_sync(
    x_admin_key: str | None = Header(default=None),
    file: UploadFile | None = File(default=None),
):
    _check_admin(x_admin_key)
    file_bytes = await file.read() if file else None
    result = sync_service.run_sync(file_bytes=file_bytes)
    return SyncResult(**result)


@app.post("/admin/toggle-llm")
def admin_toggle_llm(
    body: ToggleRequest, x_admin_key: str | None = Header(default=None)
):
    _check_admin(x_admin_key)
    groq_service.set_enabled(body.enabled)
    return {"llm_enabled": groq_service.is_enabled()}
