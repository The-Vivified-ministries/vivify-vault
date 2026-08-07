from sqlmodel import Session, select
from sqlalchemy import func, or_, text
from db import engine
from models import Sermon
from services import embeddings


def get_all_categories() -> list[str]:
    with Session(engine) as session:
        rows = session.exec(select(func.unnest(Sermon.categories)).distinct()).all()
        return sorted(set(rows))


def search_sermons(query: str, top_k: int = 3) -> list[Sermon]:
    query_text = query.strip()
    if not query_text or top_k <= 0:
        return []

    with Session(engine) as session:
        has_embeddings = session.exec(
            select(Sermon.id).where(Sermon.embedding != None).limit(1)
        ).first()

        if has_embeddings:
            query_vector = embeddings.embed_text(query_text)
            stmt = (
                select(Sermon)
                .from_statement(
                    text(
                        "SELECT * FROM sermons "
                        "WHERE embedding IS NOT NULL "
                        "ORDER BY embedding <#> CAST(:q AS vector(384)) "
                        "LIMIT :k"
                    )
                )
                .params(q=query_vector, k=top_k)
            )
            return session.exec(stmt).scalars().all()

        stmt = (
            select(Sermon)
            .where(
                or_(
                    Sermon.title.ilike(f"%{query_text}%"),
                    Sermon.description.ilike(f"%{query_text}%"),
                )
            )
            .limit(top_k)
        )
        return session.exec(stmt).all()


def get_subcategories(category: str) -> list[str]:
    with Session(engine) as session:
        stmt = (
            select(func.unnest(Sermon.subcategories))
            .where(Sermon.categories.any(category))
            .distinct()
        )
        rows = session.exec(stmt).all()
        return sorted(set(rows))


def get_years() -> list[int]:
    with Session(engine) as session:
        rows = session.exec(select(Sermon.year).distinct()).all()
        return sorted({r for r in rows if r is not None}, reverse=True)


def get_sermons(
    category: str | None = None,
    subcategory: str | None = None,
    year: int | None = None,
) -> list[Sermon]:
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
