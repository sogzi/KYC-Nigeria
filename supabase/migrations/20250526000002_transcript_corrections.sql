-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: transcript_corrections table
-- Run after: 20250526000001_speeches_pipeline_columns.sql
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.transcript_corrections (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  speech_id    uuid        NOT NULL REFERENCES public.speeches (id) ON DELETE CASCADE,
  locale       text        NOT NULL CHECK (locale IN ('en', 'ha', 'yo', 'ig')),
  correction   text        NOT NULL,
  email        text,
  status       text        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'applied', 'rejected')),
  submitted_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.transcript_corrections IS
  'User-submitted corrections to AI-generated speech transcripts/translations.';

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS transcript_corrections_speech_id_idx
  ON public.transcript_corrections (speech_id);

CREATE INDEX IF NOT EXISTS transcript_corrections_status_idx
  ON public.transcript_corrections (status);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.transcript_corrections ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can submit a correction.
CREATE POLICY "public_insert_corrections"
  ON public.transcript_corrections FOR INSERT
  TO public
  WITH CHECK (true);

-- Only service_role may read corrections (admin review workflow).
CREATE POLICY "service_role_select_corrections"
  ON public.transcript_corrections FOR SELECT
  TO service_role
  USING (true);

-- Only service_role may update the status (applied / rejected).
CREATE POLICY "service_role_update_corrections"
  ON public.transcript_corrections FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
