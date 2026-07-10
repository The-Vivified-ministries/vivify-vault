import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Pinecone
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "vivify-vault-sermons")
    PINECONE_CLOUD: str = os.getenv("PINECONE_CLOUD", "aws")
    PINECONE_REGION: str = os.getenv("PINECONE_REGION", "us-east-1")

    # Groq
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

    # Toggle: default state read from env var at startup.
    # Can be flipped live via POST /admin/toggle-llm (see main.py) but that
    # in-memory override resets to this default if the server restarts —
    # Render's free tier spins down after ~15 min idle, so treat the env
    # var as the "durable" setting and the live toggle as a same-session
    # convenience.
    GROQ_ENABLED_DEFAULT: bool = os.getenv("GROQ_ENABLED", "true").lower() == "true"

    # Admin
    ADMIN_SECRET: str = os.getenv("ADMIN_SECRET", "change-me")

    # Data source for the "excel sheet"
    # Option A (recommended): a Google Sheet published as CSV, backend
    # fetches it fresh on every /admin/sync call.
    # Option B: leave this blank and instead POST an .xlsx file directly
    # to /admin/sync as a file upload — both are supported.
    SHEET_CSV_URL: str = os.getenv("SHEET_CSV_URL", "")

    # Embedding model — 384-dim, small, free, runs locally, no PyTorch
    # (fastembed uses ONNX runtime — see services/embeddings.py for why)
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
    EMBEDDING_DIM: int = 384

    # CORS
    ALLOWED_ORIGINS: list[str] = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:3000"
    ).split(",")


settings = Settings()
