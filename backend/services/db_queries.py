from sqlmodel import Session, select
from sqlalchemy import func
from db import engine
from models import Sermon


def get_all_categories() -> list[str]:
    with Session(engine) as session:
        rows = session.exec(select(func.unnest(Sermon.categories)).distinct()).all()
        return sorted(set(rows))


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
