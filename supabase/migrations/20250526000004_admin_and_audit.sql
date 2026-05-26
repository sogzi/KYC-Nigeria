-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Admin profiles, audit log, source credibility, verification fields
-- Run after: 20250526000003_search_and_moderation.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Source credibility on content tables ───────────────────────────────────

ALTER TABLE public.track_records
  ADD COLUMN IF NOT EXISTS source_credibility text NOT NULL DEFAULT 'unverified'
    CHECK (source_credibility IN ('official', 'news_outlet', 'civil_society', 'unverified'));

ALTER TABLE public.manifestos
  ADD COLUMN IF NOT EXISTS source_credibility text NOT NULL DEFAULT 'unverified'
    CHECK (source_credibility IN ('official', 'news_outlet', 'civil_society', 'unverified'));

ALTER TABLE public.fact_checks
  ADD COLUMN IF NOT EXISTS source_credibility text NOT NULL DEFAULT 'unverified'
    CHECK (source_credibility IN ('official', 'news_outlet', 'civil_society', 'unverified'));

-- ── 2. Verification fields on candidates ──────────────────────────────────────

ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS last_verified_at  timestamptz,
  ADD COLUMN IF NOT EXISTS last_verified_by  text;

-- ── 3. Admin profiles ─────────────────────────────────────────────────────────
-- Links Supabase Auth users to admin roles/usernames.

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid UNIQUE NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  username     text UNIQUE NOT NULL,
  display_name text,
  role         text NOT NULL DEFAULT 'editor'
    CHECK (role IN ('super_admin', 'editor', 'moderator')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_profiles IS
  'One row per admin user. user_id links to Supabase auth.users.';

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Only service_role reads admin_profiles (the middleware uses the admin client)
CREATE POLICY "service_role_all_admin_profiles"
  ON public.admin_profiles FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ── 4. Audit log ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_log (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name          text NOT NULL,
  record_id           uuid NOT NULL,
  action              text NOT NULL
    CHECK (action IN ('insert', 'update', 'delete')),
  old_data            jsonb,
  new_data            jsonb,
  -- Specific field names that changed (for 'update' actions)
  changed_fields      text[],
  changed_by_id       uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  changed_by_username text,
  changed_at          timestamptz NOT NULL DEFAULT now(),
  ip_address          text
);

CREATE INDEX IF NOT EXISTS audit_log_table_record_idx
  ON public.audit_log (table_name, record_id);
CREATE INDEX IF NOT EXISTS audit_log_changed_at_idx
  ON public.audit_log (changed_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_changed_by_idx
  ON public.audit_log (changed_by_id);

COMMENT ON TABLE public.audit_log IS
  'Immutable append-only log of all admin mutations to candidate data.';

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log is insert-only from service_role; never updated or deleted
CREATE POLICY "service_role_all_audit_log"
  ON public.audit_log FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ── 5. Indexes for new candidate columns ──────────────────────────────────────

CREATE INDEX IF NOT EXISTS candidates_last_verified_at_idx
  ON public.candidates (last_verified_at DESC NULLS LAST);
