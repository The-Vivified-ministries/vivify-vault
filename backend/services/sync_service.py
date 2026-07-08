import hashlib
import json
import io
from pathlib import Path
import pandas as pd
import requests

from config import settings
from services import embeddings, pinecone_service

CACHE_PATH = Path(__file__).parent.parent / "data" / "sermons_cache.json"

REQUIRED_COLUMNS = ["Title", "Category", "Link", "Description"]


def _row_id(title: str, link: str) -> str:
    raw = f"{title.strip().lower()}|{link.strip()}"
    return hashlib.md5(raw.encode("utf-8")).hexdigest()


def _content_hash(title: str, category: str, link: str, description: str) -> str:
    raw = f"{title}|{category}|{link}|{description}"
    return hashlib.md5(raw.encode("utf-8")).hexdigest()


def _load_dataframe(file_bytes: bytes | None) -> pd.DataFrame:
    if file_bytes is not None:
        df = pd.read_excel(io.BytesIO(file_bytes))
    elif settings.SHEET_CSV_URL:
        resp = requests.get(settings.SHEET_CSV_URL, timeout=15)
        resp.raise_for_status()
        df = pd.read_csv(io.StringIO(resp.text))
    else:
        raise ValueError(
            "No data source: either upload an .xlsx file to /admin/sync "
            "or set SHEET_CSV_URL in the environment."
        )

    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Sheet is missing required column(s): {missing}")

    df = df.dropna(subset=["Title", "Link"])
    if "Speaker" not in df.columns:
        df["Speaker"] = ""
    df = df.fillna("")
    return df


def run_sync(file_bytes: bytes | None = None) -> dict:
    df = _load_dataframe(file_bytes)

    rows = []
    for _, r in df.iterrows():
        title = str(r["Title"]).strip()
        category = str(r["Category"]).strip()
        link = str(r["Link"]).strip()
        description = str(r["Description"]).strip()
        speaker = str(r.get("Speaker", "")).strip()
        rows.append(
            {
                "id": _row_id(title, link),
                "title": title,
                "category": category,
                "link": link,
                "description": description,
                "speaker": speaker,
                "content_hash": _content_hash(title, category, link, description),
            }
        )

    existing_hashes = pinecone_service.fetch_existing_hashes([r["id"] for r in rows])

    to_embed = [
        r for r in rows if existing_hashes.get(r["id"]) != r["content_hash"]
    ]

    errors: list[str] = []
    if to_embed:
        try:
            texts = [f"{r['title']}. {r['description']}" for r in to_embed]
            vectors = embeddings.embed_texts(texts)
            items = [
                {
                    "id": r["id"],
                    "values": vec,
                    "metadata": {
                        "title": r["title"],
                        "category": r["category"],
                        "link": r["link"],
                        "description": r["description"],
                        "speaker": r["speaker"],
                        "content_hash": r["content_hash"],
                    },
                }
                for r, vec in zip(to_embed, vectors)
            ]
            pinecone_service.upsert_sermons(items)
        except Exception as e:
            errors.append(str(e))

    # Regenerate the full browse cache regardless of what changed —
    # this is what powers the catalogue list/filter endpoints, kept
    # separate from Pinecone (which is only the search index).
    CACHE_PATH.parent.mkdir(exist_ok=True)
    cache_data = [
        {
            "id": r["id"],
            "title": r["title"],
            "category": r["category"],
            "link": r["link"],
            "description": r["description"],
            "speaker": r["speaker"],
        }
        for r in rows
    ]
    CACHE_PATH.write_text(json.dumps(cache_data, indent=2))

    return {
        "total_rows": len(rows),
        "new_or_updated": len(to_embed),
        "unchanged": len(rows) - len(to_embed),
        "errors": errors,
    }


def load_cached_sermons() -> list[dict]:
    if not CACHE_PATH.exists():
        return []
    return json.loads(CACHE_PATH.read_text())
