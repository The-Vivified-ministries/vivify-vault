from pydantic import BaseModel


class SermonMetadata(BaseModel):
    title: str
    category: str
    speaker: str | None = None
    link: str
    description: str


class SearchResult(BaseModel):
    id: str
    score: float
    sermon: SermonMetadata


class ChatRequest(BaseModel):
    query: str
    top_k: int = 3


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
