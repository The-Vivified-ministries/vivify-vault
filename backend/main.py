import csv
import io

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models import (
    ChatRequest,
    ChatResponse,
    SearchResult,
    SermonAdminRequest,
    BulkSermonCreateRequest,
    SermonOut,
    ToggleRequest,
    SyncResult,
)
from services import embeddings, email_service, groq_service, sync_service, db_queries

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
    sermons = db_queries.search_sermons(req.query, top_k=req.top_k)

    sermons_for_llm = [
        {
            "title": s.title,
            "categories": s.categories,
            "description": s.description,
            "link": s.spotify_link or s.apple_music_link or "",
        }
        for s in sermons
    ]
    answer = groq_service.generate_recommendation(req.query, sermons_for_llm)

    results = [
        SearchResult(
            id=str(s.id),
            score=0.0,
            sermon=SermonOut(
                id=s.id or 0,
                title=s.title,
                year=s.year,
                categories=s.categories,
                subcategories=s.subcategories,
                description=s.description,
                spotify_link=s.spotify_link,
                apple_music_link=s.apple_music_link,
            ),
        )
        for s in sermons
    ]
    return ChatResponse(answer=answer, llm_used=groq_service.is_enabled(), results=results)


@app.get("/search", response_model=list[SermonOut])
def search(q: str, top_k: int = 3):
    sermons = db_queries.search_sermons_titles(q, top_k=top_k)
    return [SermonOut(**s.dict()) for s in sermons]


@app.post("/admin/sync", response_model=SyncResult)
def admin_sync(x_admin_key: str | None = Header(default=None)):
    _check_admin(x_admin_key)
    result = sync_service.run_sync()
    return SyncResult(**result)


@app.get("/admin/sermons", response_model=list[SermonOut])
def admin_get_sermons(x_admin_key: str | None = Header(default=None)):
    _check_admin(x_admin_key)
    sermons = db_queries.get_all_sermons(limit=500)
    return [SermonOut(**s.dict()) for s in sermons]


@app.post("/admin/sermons", response_model=SermonOut)
def admin_save_sermon(
    body: SermonAdminRequest, x_admin_key: str | None = Header(default=None)
):
    _check_admin(x_admin_key)
    try:
        sermon = db_queries.save_sermon(body.sermon.dict())
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    action = "created" if body.sermon.id is None else "updated"
    email_service.send_admin_notification(
        body.user_name,
        action,
        sermon.dict(),
    )
    return SermonOut(**sermon.dict())


@app.post("/admin/sermons/bulk-add", response_model=list[SermonOut])
def admin_bulk_add_sermons(
    body: BulkSermonCreateRequest, x_admin_key: str | None = Header(default=None)
):
    _check_admin(x_admin_key)
    try:
        reader = csv.DictReader(io.StringIO(body.csv_text.strip()))
        required_columns = {"title", "year", "categories", "subcategories"}
        if not reader.fieldnames or not required_columns.issubset(reader.fieldnames):
            raise ValueError("CSV must include title, year, categories, and subcategories columns")
        sermon_data = []
        for row in reader:
            if not (row.get("title") or "").strip():
                raise ValueError("Every CSV row must have a title")
            sermon_data.append({
                "title": row["title"].strip(),
                "year": int(row["year"]) if row.get("year", "").strip() else None,
                "categories": [value.strip() for value in row.get("categories", "").split(",") if value.strip()],
                "subcategories": [value.strip() for value in row.get("subcategories", "").split(",") if value.strip()],
                "description": (row.get("description") or "").strip(),
                "spotify_link": (row.get("spotify_link") or "").strip() or None,
                "apple_music_link": (row.get("apple_music_link") or "").strip() or None,
            })
        sermons = db_queries.bulk_create_sermons(sermon_data)
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    email_service.send_admin_notification(
        body.user_name,
        f"bulk created {len(sermons)} sermons",
        {"title": f"{len(sermons)} sermons", "year": None, "categories": [], "subcategories": []},
    )
    return [SermonOut(**sermon.dict()) for sermon in sermons]


@app.post("/admin/toggle-llm")
def admin_toggle_llm(
    body: ToggleRequest, x_admin_key: str | None = Header(default=None)
):
    _check_admin(x_admin_key)
    groq_service.set_enabled(body.enabled)
    return {"llm_enabled": groq_service.is_enabled()}
