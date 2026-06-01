-- ─────────────────────────────────────────────────────────────────────────────
-- news_articles
-- Stores fetched + AI-enriched articles about the 2027 Nigerian elections.
-- Populated by the /api/news/refresh endpoint; read by the public news page.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS news_articles (
  -- Stable primary key = SHA-256(url) truncated to 40 chars
  id           TEXT        PRIMARY KEY,

  -- Raw fields from NewsAPI / GNews
  title        TEXT        NOT NULL,
  description  TEXT,
  url          TEXT        NOT NULL UNIQUE,
  source_name  TEXT,
  author       TEXT,
  published_at TIMESTAMPTZ,
  image_url    TEXT,

  -- AI-enrichment fields (populated by Claude)
  ai_summary            TEXT,
  candidates_mentioned  TEXT[]  NOT NULL DEFAULT '{}',
  policy_tags           TEXT[]  NOT NULL DEFAULT '{}',
  sentiment             TEXT    CHECK (sentiment IN ('positive','negative','neutral','mixed')),
  ai_enriched_at        TIMESTAMPTZ,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookups
CREATE INDEX IF NOT EXISTS news_published_idx     ON news_articles (published_at DESC);
CREATE INDEX IF NOT EXISTS news_sentiment_idx     ON news_articles (sentiment);
CREATE INDEX IF NOT EXISTS news_candidates_idx    ON news_articles USING GIN (candidates_mentioned);
CREATE INDEX IF NOT EXISTS news_policy_tags_idx   ON news_articles USING GIN (policy_tags);

-- Row-level security
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

-- Anyone can read published news
CREATE POLICY "public_read_news"
  ON news_articles FOR SELECT TO public USING (true);

-- Only the service role (server-side pipeline) can write
CREATE POLICY "service_write_news"
  ON news_articles FOR ALL TO service_role USING (true) WITH CHECK (true);
