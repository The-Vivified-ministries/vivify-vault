import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Postgres (Supabase) — this is now the live source of truth for
    # browsing. Use the "Transaction pooler" connection string from
    # Supabase's Connect dialog for better reliability against a
    # non-persistent backend like Render's free tier.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # Groq
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    GROQ_ENABLED_DEFAULT: bool = os.getenv("GROQ_ENABLED", "true").lower() == "true"

    # Admin
    ADMIN_SECRET: str = os.getenv("ADMIN_SECRET", "change-me")

    # Embedding model — no PyTorch (see services/embeddings.py)
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
    EMBEDDING_DIM: int = 384

    # CORS
    ALLOWED_ORIGINS: list[str] = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:3000"
    ).split(",")

    # Only used by scripts/fill_descriptions_from_spotify.py
    SPOTIFY_CLIENT_ID: str = os.getenv("SPOTIFY_CLIENT_ID", "")
    SPOTIFY_CLIENT_SECRET: str = os.getenv("SPOTIFY_CLIENT_SECRET", "")
    SPOTIFY_MARKET: str = os.getenv("SPOTIFY_MARKET", "NG")


settings = Settings()
