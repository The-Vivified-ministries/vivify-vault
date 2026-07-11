-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run

CREATE TABLE IF NOT EXISTS sermons (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    year INTEGER,
    categories TEXT[] NOT NULL DEFAULT '{}',
    subcategories TEXT[] NOT NULL DEFAULT '{}',
    description TEXT NOT NULL DEFAULT '',
    spotify_link TEXT,
    apple_music_link TEXT,
    -- Tracks what was last embedded into Pinecone, so sync only
    -- re-embeds rows that actually changed. Not something you need to
    -- touch when editing sermons in the Table Editor.
    last_synced_hash TEXT,

    CONSTRAINT valid_categories CHECK (
        categories <@ ARRAY['Theological','Real Life','Spirituals','Bible Series','Events']::text[]
    )
);

-- Speeds up the array-containment queries the browsing endpoints run
-- (WHERE 'Theological' = ANY(categories), etc.)
CREATE INDEX IF NOT EXISTS idx_sermons_categories ON sermons USING GIN (categories);
CREATE INDEX IF NOT EXISTS idx_sermons_subcategories ON sermons USING GIN (subcategories);
CREATE INDEX IF NOT EXISTS idx_sermons_year ON sermons (year);

-- Optional: a couple of test rows to confirm everything's wired up
-- before your PM starts entering real data. Safe to delete after testing.
INSERT INTO sermons (title, year, categories, subcategories, description, spotify_link, apple_music_link)
VALUES
    ('Anchored by Abundant Grace', 2024, ARRAY['Theological'], ARRAY['Soteriology','Abundant Grace'],
     'A message on how God''s grace holds us steady even when we feel like we are drifting.',
     'https://open.spotify.com/episode/test1', 'https://podcasts.apple.com/test1'),
    ('Fighting Zombies', 2023, ARRAY['Real Life'], ARRAY['Victory Over Sin'],
     'Uses the metaphor of zombies to describe recurring sins that keep coming back to life.',
     'https://open.spotify.com/episode/test2', 'https://podcasts.apple.com/test2')
ON CONFLICT DO NOTHING;
