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
                        "ORDER BY ("
                        "  0.75 * (1 - (embedding <#> CAST(:q AS vector(384)))) + "
                        "  0.25 * (CASE WHEN title ILIKE :t THEN 0.6 ELSE 0 END + "
                        "               CASE WHEN description ILIKE :t THEN 0.4 ELSE 0 END)"
                        ") DESC "
                        "LIMIT :k"
                    )
                )
                .params(q=query_vector, t=f"%{query_text}%", k=top_k)
            )
            return session.exec(stmt).all()

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
