CREATE TABLE IF NOT EXISTS query_logs (
    id SERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "function" TEXT NOT NULL CHECK ("function" IN ('search', 'chat'))
);

CREATE INDEX IF NOT EXISTS idx_query_logs_date ON query_logs (date);

CREATE TABLE IF NOT EXISTS chat_ratings (
    id SERIAL PRIMARY KEY,
    query_id INTEGER NOT NULL UNIQUE REFERENCES query_logs(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);