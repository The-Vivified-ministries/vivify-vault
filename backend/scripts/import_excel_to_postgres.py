"""
One-time (or occasional bulk) import — reads an .xlsx with columns:
Title, Year, Categories, Subcategories, Description, Spotify Link,
Apple Music Link — where Categories/Subcategories are comma-separated
text in a single cell (e.g. "Theological, Real Life") — and
inserts/updates rows in Postgres.

This is how your existing Excel-based data (e.g. after running
fill_descriptions_from_spotify.py) gets into the new database. Ongoing
day-to-day edits after this should happen directly in Supabase's Table
Editor, not through this script.

Usage:
    python scripts/import_excel_to_postgres.py --input data/sermons_final.xlsx
"""

import argparse
import os
import sys
import pandas as pd
from sqlmodel import Session, select

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import engine
from models import Sermon

REQUIRED_COLUMNS = [
    "Title", "Year", "Categories", "Subcategories",
    "Description", "Spotify Link", "Apple Music Link",
]


def parse_list(cell) -> list[str]:
    if pd.isna(cell) or not str(cell).strip():
        return []
    return [x.strip() for x in str(cell).split(",") if x.strip()]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    args = parser.parse_args()

    df = pd.read_excel(args.input)
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise SystemExit(f"Missing column(s): {missing}")

    created, updated = 0, 0
    with Session(engine) as session:
        for _, row in df.iterrows():
            title = str(row["Title"]).strip()
            if not title:
                continue

            existing = session.exec(select(Sermon).where(Sermon.title == title)).first()

            data = dict(
                title=title,
                year=int(row["Year"]) if not pd.isna(row["Year"]) else None,
                categories=parse_list(row["Categories"]),
                subcategories=parse_list(row["Subcategories"]),
                description=str(row["Description"]).strip() if not pd.isna(row["Description"]) else "",
                spotify_link=str(row["Spotify Link"]).strip() if not pd.isna(row["Spotify Link"]) else None,
                apple_music_link=str(row["Apple Music Link"]).strip() if not pd.isna(row["Apple Music Link"]) else None,
            )

            if existing:
                for k, v in data.items():
                    setattr(existing, k, v)
                session.add(existing)
                updated += 1
            else:
                session.add(Sermon(**data))
                created += 1

        session.commit()

    print(f"Created: {created}, Updated: {updated}")
    print("Next: POST /admin/sync (with your X-Admin-Key) to push these into Pinecone for search.")


if __name__ == "__main__":
    main()
