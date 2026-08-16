from sqlmodel import SQLModel, Field, Column
from sqlalchemy import ARRAY, String
from pgvector.sqlalchemy import Vector
from pydantic import BaseModel


class Sermon(SQLModel, table=True):
    __tablename__ = "sermons"

    id: int | None = Field(default=None, primary_key=True)
    title: str
    year: int | None = None
    categories: list[str] = Field(default_factory=list, sa_column=Column(ARRAY(String)))
    subcategories: list[str] = Field(default_factory=list, sa_column=Column(ARRAY(String)))
    description: str = ""
    spotify_link: str | None = None
    apple_music_link: str | None = None
    embedding: list[float] | None = Field(default=None, sa_column=Column(Vector(384)))
    last_synced_hash: str | None = None


# --- API schemas ---

class SermonOut(BaseModel):
    id: int
    title: str
    year: int | None
    categories: list[str]
    subcategories: list[str]
    description: str
    spotify_link: str | None
    apple_music_link: str | None


class ChatRequest(BaseModel):
    query: str
    top_k: int = 3


class SearchResult(BaseModel):
    id: str
    score: float
    sermon: SermonOut


class SermonAdminPayload(BaseModel):
    id: int | None = None
    title: str
    year: int | None = None
    categories: list[str] = []
    subcategories: list[str] = []
    description: str = ""
    spotify_link: str | None = None
    apple_music_link: str | None = None


class SermonAdminRequest(BaseModel):
    user_name: str
    sermon: SermonAdminPayload


class ChatResponse(BaseModel):
    answer: str
    llm_used: bool
    results: list[SearchResult]


class ToggleRequest(BaseModel):
    enabled: bool


class SyncResult(BaseModel):
    total_rows: int
    new_or_updated: int
    unchanged: int
    errors: list[str]
