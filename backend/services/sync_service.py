import hashlib
import re
from sqlmodel import Session, select
from sqlalchemy import func
from sqlalchemy.orm import load_only
from db import engine
from models import Sermon
from services import embeddings

_EMBED_BATCH_SIZE = 32


def _content_hash(s: Sermon) -> str:
    raw = (
        f"{s.title}|{s.year}|{','.join(sorted(s.categories))}|"
        f"{','.join(sorted(s.subcategories))}|{s.description}|"
        f"{s.spotify_link}|{s.apple_music_link}"
    )
    return hashlib.md5(raw.encode("utf-8")).hexdigest()


def _strip_html(text: str) -> str:
    if not text:
        return ""
    return re.sub(r"<[^>]+>", "", text).strip()


def run_sync() -> dict:
    errors: list[str] = []
    new_or_updated = 0
    unchanged = 0

    with Session(engine) as session:
        total = session.exec(select(func.count()).select_from(Sermon)).one()
        missing_embeddings = session.exec(
            select(func.count()).select_from(Sermon).where(Sermon.embedding.is_(None))
        ).one()
        unchanged = total - missing_embeddings

        while True:
            to_embed = session.exec(
                select(Sermon)
                .where(Sermon.embedding.is_(None))
                .options(
                    load_only(
                        Sermon.id,
                        Sermon.title,
                        Sermon.year,
                        Sermon.categories,
                        Sermon.subcategories,
                        Sermon.description,
                        Sermon.spotify_link,
                        Sermon.apple_music_link,
                        Sermon.last_synced_hash,
                    )
                )
                .order_by(Sermon.id)
                .limit(_EMBED_BATCH_SIZE)
            ).all()
            if not to_embed:
                break

            try:
                texts = [
                    f"{s.title}. {_strip_html(s.description)}"
                    for s in to_embed
                ]
                vectors = embeddings.embed_texts(texts)
                if len(vectors) != len(to_embed):
                    raise ValueError("Embedding count does not match sermon count")

                for s, vec in zip(to_embed, vectors):
                    s.embedding = vec
                    s.last_synced_hash = _content_hash(s)
                    session.add(s)
                session.commit()
                new_or_updated += len(to_embed)
            except Exception as e:
                session.rollback()
                errors.append(str(e))
                break

    return {
        "total_rows": total,
        "new_or_updated": new_or_updated,
        "unchanged": unchanged,
        "errors": errors,
    }
