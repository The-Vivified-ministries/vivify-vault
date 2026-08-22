from sqlmodel import Session, select
import logging
from sqlalchemy import func, or_, text, case
from db import engine
from models import Sermon
from services import embeddings
from pgvector.sqlalchemy import Vector
from taxonomy import get_categories, get_subcategories as get_fixed_subcategories, is_valid_pair


def get_all_categories() -> list[str]:
    return get_categories()


def search_sermons(query: str, top_k: int = 3) -> list[Sermon]:
    query_text = query.strip()

    if not query_text or top_k <= 0:
        return []

    with Session(engine) as session:
        query_vector = embeddings.embed_text(query_text)

        similarity = (
            0.65 * (1 - Sermon.embedding.cosine_distance(query_vector))
            +
            0.35 * (
                case(
                    (Sermon.title.ilike(f"%{query_text}%"), 0.6),
                    else_=0
                )
                +
                case(
                    (Sermon.description.ilike(f"%{query_text}%"), 0.4),
                    else_=0
                )
            )
        )

        stmt = (
            select(Sermon)
            .where(Sermon.embedding.is_not(None))
            .order_by(similarity.desc())
            .limit(top_k)
        )

        sermons = session.exec(stmt).all()

        for sermon in sermons:
            print(
                "RESULT:",
                sermon.id,
                repr(sermon.title)
            )

        return sermons


def get_all_sermons(limit: int = 200) -> list[Sermon]:
    with Session(engine) as session:
        stmt = select(Sermon).order_by(Sermon.title).limit(limit)
        return session.exec(stmt).all()


def save_sermon(sermon_data: dict) -> Sermon:
    with Session(engine) as session:
        sermon_id = sermon_data.get("id")
        if sermon_id:
            sermon = session.get(Sermon, sermon_id)
            if sermon is None:
                raise ValueError("Sermon not found")
            for field, value in sermon_data.items():
                if field != "id":
                    setattr(sermon, field, value)
        else:
            sermon = Sermon(**sermon_data)
            session.add(sermon)
        session.commit()
        session.refresh(sermon)
        return sermon


def search_sermons_titles(query: str, top_k: int = 50) -> list[Sermon]:
    """Pure database search over sermon titles (lexical only)."""
    query_text = query.strip()
    if not query_text or top_k <= 0:
        return []

    with Session(engine) as session:
        stmt = (
            select(Sermon)
            .where(Sermon.title.ilike(f"%{query_text}%"))
            .order_by(Sermon.title)
            .limit(top_k)
        )
        return session.exec(stmt).all()


def get_subcategories(category: str) -> list[str]:
    return get_fixed_subcategories(category)


def get_years() -> list[int]:
    with Session(engine) as session:
        rows = session.exec(select(Sermon.year).distinct()).all()
        return sorted({r for r in rows if r is not None}, reverse=True)


def get_sermons(
    category: str | None = None,
    subcategory: str | None = None,
    year: int | None = None,
) -> list[Sermon]:
    if category and subcategory and not is_valid_pair(category, subcategory):
        return []

    with Session(engine) as session:
        stmt = select(Sermon)
        if category:
            stmt = stmt.where(Sermon.categories.any(category))
        if subcategory:
            stmt = stmt.where(Sermon.subcategories.any(subcategory))
        if year:
            stmt = stmt.where(Sermon.year == year)
        stmt = stmt.order_by(Sermon.title)
        return session.exec(stmt).all()
