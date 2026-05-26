-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add speech transcription pipeline columns
-- Run after: 20250526000000_initial_schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. New columns on the speeches table ──────────────────────────────────────

ALTER TABLE public.speeches
  ADD COLUMN IF NOT EXISTS audio_storage_path  text,
  ADD COLUMN IF NOT EXISTS transcription_status text NOT NULL DEFAULT 'none'
    CHECK (transcription_status IN ('none', 'processing', 'done', 'error')),
  ADD COLUMN IF NOT EXISTS transcription_error  text,
  ADD COLUMN IF NOT EXISTS ai_translated        boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.speeches.audio_storage_path IS
  'Supabase Storage path for the uploaded audio/video file (bucket: speech-audio).';

COMMENT ON COLUMN public.speeches.transcription_status IS
  'Pipeline status: none | processing | done | error';

COMMENT ON COLUMN public.speeches.transcription_error IS
  'Last error message from the transcription/translation pipeline, if any.';

COMMENT ON COLUMN public.speeches.ai_translated IS
  'True when transcription (Whisper) and translations (Claude) were AI-generated.';

-- ── 2. Index for quickly finding speeches that need processing ─────────────────

CREATE INDEX IF NOT EXISTS speeches_transcription_status_idx
  ON public.speeches (transcription_status);

-- ── 3. Supabase Storage bucket ────────────────────────────────────────────────
-- NOTE: Execute this block once per environment via the Supabase dashboard or
-- `supabase db push`. The storage schema may not be present in local dev
-- if you are not running the full Supabase stack.

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'speech-audio',
    'speech-audio',
    false,                           -- private: signed URLs required
    26214400,                        -- 25 MB cap (Whisper API limit)
    ARRAY[
      'audio/mpeg', 'audio/mp3', 'audio/mp4',
      'audio/wav', 'audio/webm', 'audio/ogg',
      'audio/x-m4a', 'audio/aac',
      'video/mp4', 'video/webm', 'video/quicktime'
    ]
  )
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN undefined_table THEN
    -- storage schema not present (local dev without full stack) — skip silently
    NULL;
END;
$$;

-- ── 4. Storage RLS policies ───────────────────────────────────────────────────
-- Allow service_role to upload and download. No public access.

DO $$
BEGIN
  -- Upload: service_role only
  BEGIN
    CREATE POLICY "service_role_upload"
      ON storage.objects FOR INSERT
      TO service_role
      WITH CHECK (bucket_id = 'speech-audio');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- Download: service_role only (signed URLs are issued by the API route)
  BEGIN
    CREATE POLICY "service_role_download"
      ON storage.objects FOR SELECT
      TO service_role
      USING (bucket_id = 'speech-audio');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  -- Delete: service_role only
  BEGIN
    CREATE POLICY "service_role_delete"
      ON storage.objects FOR DELETE
      TO service_role
      USING (bucket_id = 'speech-audio');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
EXCEPTION
  WHEN undefined_table THEN NULL;
END;
$$;
