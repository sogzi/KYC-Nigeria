-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Full-text search on manifestos/speeches + moderation queue
-- Run after: 20250526000002_speeches_pipeline_columns.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. FTS vector on manifestos ────────────────────────────────────────────────

ALTER TABLE public.manifestos
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS manifestos_search_vector_idx
  ON public.manifestos USING GIN (search_vector);

CREATE OR REPLACE FUNCTION public.update_manifesto_search_vector()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.section_title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')),        'B');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_manifesto_search ON public.manifestos;
CREATE TRIGGER trg_manifesto_search
  BEFORE INSERT OR UPDATE ON public.manifestos
  FOR EACH ROW EXECUTE FUNCTION public.update_manifesto_search_vector();

-- Back-fill existing rows
UPDATE public.manifestos SET search_vector =
  setweight(to_tsvector('english', coalesce(section_title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')),        'B');

-- ── 2. FTS vector on speeches ─────────────────────────────────────────────────

ALTER TABLE public.speeches
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS speeches_search_vector_idx
  ON public.speeches USING GIN (search_vector);

CREATE OR REPLACE FUNCTION public.update_speech_search_vector()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title,         '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.transcript_en, '')), 'B');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_speech_search ON public.speeches;
CREATE TRIGGER trg_speech_search
  BEFORE INSERT OR UPDATE ON public.speeches
  FOR EACH ROW EXECUTE FUNCTION public.update_speech_search_vector();

-- Back-fill existing rows
UPDATE public.speeches SET search_vector =
  setweight(to_tsvector('english', coalesce(title,         '')), 'A') ||
  setweight(to_tsvector('english', coalesce(transcript_en, '')), 'B');

-- ── 3. Moderation queue ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL
    CHECK (content_type IN ('manifesto', 'track_record', 'speech', 'candidate')),
  content_id   uuid NOT NULL,
  reason       text NOT NULL
    CHECK (reason IN ('wrong_info', 'missing_context', 'outdated', 'other')),
  user_note    text,
  ip_hash      text,
  status       text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by  text,
  reviewer_note text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  reviewed_at  timestamptz
);

CREATE INDEX IF NOT EXISTS moderation_queue_status_idx
  ON public.moderation_queue (status, created_at DESC);

CREATE INDEX IF NOT EXISTS moderation_queue_content_idx
  ON public.moderation_queue (content_type, content_id);

-- ── 4. Moderation RLS ─────────────────────────────────────────────────────────

ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a flag (INSERT only — no SELECT for anonymous users)
CREATE POLICY "public_insert_moderation"
  ON public.moderation_queue FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Service role has full access (admin dashboard)
CREATE POLICY "service_role_all_moderation"
  ON public.moderation_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
