import hashlib
from sqlmodel import Session, select
from db import engine
from models import Sermon
from services import embeddings, pinecone_service


def _content_hash(s: Sermon) -> str:
    raw = (
        f"{s.title}|{s.year}|{','.join(sorted(s.categories))}|"
        f"{','.join(sorted(s.subcategories))}|{s.description}|"
        f"{s.spotify_link}|{s.apple_music_link}"
    )
    return hashlib.md5(raw.encode("utf-8")).hexdigest()


def run_sync() -> dict:
    errors: list[str] = []
    new_or_updated = 0
    unchanged = 0

    with Session(engine) as session:
        sermons = session.exec(select(Sermon)).all()
        total = len(sermons)

        to_embed: list[tuple[Sermon, str]] = []
        for s in sermons:
            h = _content_hash(s)
            if s.last_synced_hash != h:
                to_embed.append((s, h))
            else:
                unchanged += 1

        if to_embed:
            try:
                texts = [f"{s.title}. {s.description}" for s, _ in to_embed]
                vectors = embeddings.embed_texts(texts)
                items = [
                    {
                        "id": str(s.id),
                        "values": vec,
                        "metadata": {
                            "title": s.title,
                            "year": s.year or 0,
                            "categories": s.categories,
                            "subcategories": s.subcategories,
                            "description": s.description,
                            "spotify_link": s.spotify_link or "",
                            "apple_music_link": s.apple_music_link or "",
                        },
                    }
                    for (s, _), vec in zip(to_embed, vectors)
                ]
                pinecone_service.upsert_sermons(items)

                for s, h in to_embed:
                    s.last_synced_hash = h
                    session.add(s)
                session.commit()
                new_or_updated = len(to_embed)
            except Exception as e:
                errors.append(str(e))

    return {
        "total_rows": total,
        "new_or_updated": new_or_updated,
        "unchanged": unchanged,
        "errors": errors,
    }
