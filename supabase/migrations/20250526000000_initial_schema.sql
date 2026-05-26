-- ============================================================
--  Know Your Candidate Nigeria — Initial Schema
--  Run with: supabase db push  (or paste into the SQL editor)
-- ============================================================


-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "unaccent";   -- accent-insensitive search


-- ── Enum Types ───────────────────────────────────────────────────────────────

create type election_type as enum (
  'presidential',
  'gubernatorial',
  'senatorial',
  'house_of_reps'
);

create type manifesto_category as enum (
  'economy',
  'security',
  'education',
  'healthcare',
  'infrastructure',
  'corruption'
);

create type track_record_type as enum (
  'achievement',
  'controversy',
  'conviction',
  'policy',
  'appointment'
);

-- Using text strings so the type is unambiguous in all contexts
create type fact_check_verdict as enum (
  'true',
  'false',
  'misleading',
  'unverified'
);


-- ── Helper: auto-stamp updated_at ────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ── Helper: maintain candidates full-text search vector ──────────────────────
create or replace function update_candidate_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.full_name,         '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.party_affiliation, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.current_position,  '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.biography,         '')), 'C');
  return new;
end;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
--  TABLE: candidates
-- ─────────────────────────────────────────────────────────────────────────────
create table candidates (
  id                uuid          primary key default uuid_generate_v4(),

  -- Identity
  full_name         text          not null,
  photo_url         text,                         -- Supabase Storage public URL
  date_of_birth     date,
  state_of_origin   text,                         -- one of Nigeria's 36 states + FCT
  local_government  text,

  -- Election context
  party_affiliation text          not null,       -- e.g. 'APC', 'PDP', 'Labour'
  election_type     election_type not null,
  state             text,                         -- null only for presidential races
  constituency      text,                         -- senatorial district / house constituency

  -- Background
  current_position  text,
  biography         text,
  education         jsonb         not null default '[]'::jsonb,
  --  [{institution, degree, field?, year_start?, year_end?}]

  -- Admin
  is_verified       boolean       not null default false,
  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now(),

  -- Full-text search (updated by trigger)
  search_vector     tsvector,

  -- State is required for every race below presidential level
  constraint state_required_for_state_races
    check (election_type = 'presidential' or state is not null)
);

create trigger candidates_set_updated_at
  before update on candidates
  for each row execute function set_updated_at();

create trigger candidates_search_vector_update
  before insert or update on candidates
  for each row execute function update_candidate_search_vector();


-- ─────────────────────────────────────────────────────────────────────────────
--  TABLE: manifestos
-- ─────────────────────────────────────────────────────────────────────────────
create table manifestos (
  id            uuid               primary key default uuid_generate_v4(),
  candidate_id  uuid               not null references candidates(id) on delete cascade,
  section_title text               not null,
  content       text               not null,
  category      manifesto_category not null,
  created_at    timestamptz        not null default now()
);


-- ─────────────────────────────────────────────────────────────────────────────
--  TABLE: track_records
-- ─────────────────────────────────────────────────────────────────────────────
create table track_records (
  id            uuid              primary key default uuid_generate_v4(),
  candidate_id  uuid              not null references candidates(id) on delete cascade,
  year          integer           not null check (year between 1960 and 2100),
  title         text              not null,
  description   text              not null,
  source_url    text,
  record_type   track_record_type not null,
  created_at    timestamptz       not null default now()
);


-- ─────────────────────────────────────────────────────────────────────────────
--  TABLE: asset_declarations
-- ─────────────────────────────────────────────────────────────────────────────
create table asset_declarations (
  id                 uuid        primary key default uuid_generate_v4(),
  candidate_id       uuid        not null references candidates(id) on delete cascade,
  declaration_year   integer     not null check (declaration_year between 1999 and 2100),
  total_assets_naira numeric(22, 2),   -- up to ~99 trillion ₦ with kobo precision
  properties         jsonb       not null default '[]'::jsonb,
  --  [{description, location, estimated_value_naira?}]
  vehicles           jsonb       not null default '[]'::jsonb,
  --  [{make, model, year?, estimated_value_naira?}]
  cash               jsonb       not null default '[]'::jsonb,
  --  [{currency, amount, institution?}]
  liabilities        jsonb       not null default '[]'::jsonb,
  --  [{description, creditor, amount_naira}]
  source_url         text,
  verified           boolean     not null default false,
  created_at         timestamptz not null default now(),

  -- One declaration per candidate per year
  unique (candidate_id, declaration_year)
);


-- ─────────────────────────────────────────────────────────────────────────────
--  TABLE: speeches
-- ─────────────────────────────────────────────────────────────────────────────
create table speeches (
  id             uuid        primary key default uuid_generate_v4(),
  candidate_id   uuid        not null references candidates(id) on delete cascade,
  title          text        not null,
  date           date        not null,
  video_url      text,
  transcript_en  text,
  transcript_ha  text,
  transcript_yo  text,
  transcript_ig  text,
  tags           text[]      not null default '{}',
  source         text,
  created_at     timestamptz not null default now()
);


-- ─────────────────────────────────────────────────────────────────────────────
--  TABLE: fact_checks
-- ─────────────────────────────────────────────────────────────────────────────
create table fact_checks (
  id            uuid               primary key default uuid_generate_v4(),
  candidate_id  uuid               not null references candidates(id) on delete cascade,
  claim         text               not null,
  verdict       fact_check_verdict not null default 'unverified',
  explanation   text               not null,
  source_url    text,
  checked_by    text,
  checked_at    timestamptz        not null default now(),
  created_at    timestamptz        not null default now()
);


-- ── Indexes ──────────────────────────────────────────────────────────────────

-- candidates — main lookup paths
create index idx_candidates_election_type   on candidates (election_type);
create index idx_candidates_party           on candidates (party_affiliation);
create index idx_candidates_state           on candidates (state) where state is not null;
create index idx_candidates_verified        on candidates (is_verified);
create index idx_candidates_fts             on candidates using gin (search_vector);
create index idx_candidates_education       on candidates using gin (education);

-- manifestos
create index idx_manifestos_candidate       on manifestos (candidate_id);
create index idx_manifestos_category        on manifestos (category);

-- track_records
create index idx_track_records_candidate    on track_records (candidate_id);
create index idx_track_records_year         on track_records (year desc);
create index idx_track_records_type         on track_records (record_type);

-- asset_declarations
create index idx_asset_decl_candidate       on asset_declarations (candidate_id);
create index idx_asset_decl_year            on asset_declarations (declaration_year desc);
create index idx_asset_decl_properties      on asset_declarations using gin (properties);
create index idx_asset_decl_vehicles        on asset_declarations using gin (vehicles);

-- speeches
create index idx_speeches_candidate         on speeches (candidate_id);
create index idx_speeches_date              on speeches (date desc);
create index idx_speeches_tags              on speeches using gin (tags);

-- fact_checks
create index idx_fact_checks_candidate      on fact_checks (candidate_id);
create index idx_fact_checks_verdict        on fact_checks (verdict);


-- ── Row Level Security ───────────────────────────────────────────────────────

alter table candidates         enable row level security;
alter table manifestos         enable row level security;
alter table track_records      enable row level security;
alter table asset_declarations enable row level security;
alter table speeches           enable row level security;
alter table fact_checks        enable row level security;

-- Everyone may read all rows (public voter education data)
create policy "public_read_candidates"
  on candidates for select using (true);

create policy "public_read_manifestos"
  on manifestos for select using (true);

create policy "public_read_track_records"
  on track_records for select using (true);

create policy "public_read_asset_declarations"
  on asset_declarations for select using (true);

create policy "public_read_speeches"
  on speeches for select using (true);

create policy "public_read_fact_checks"
  on fact_checks for select using (true);

-- Only the service role (server-side admin operations) may write
-- The service role key bypasses RLS entirely; these explicit policies
-- are a belt-and-suspenders guard for authenticated-role write paths.
create policy "service_role_write_candidates"
  on candidates for all
  using     ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

create policy "service_role_write_manifestos"
  on manifestos for all
  using     ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

create policy "service_role_write_track_records"
  on track_records for all
  using     ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

create policy "service_role_write_asset_declarations"
  on asset_declarations for all
  using     ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

create policy "service_role_write_speeches"
  on speeches for all
  using     ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

create policy "service_role_write_fact_checks"
  on fact_checks for all
  using     ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');


-- ── Comments ─────────────────────────────────────────────────────────────────
comment on table candidates         is 'Nigerian election candidates across all race types.';
comment on table manifestos         is 'Structured manifesto sections per candidate, categorised by policy area.';
comment on table track_records      is 'Verifiable events from a candidate''s public record (achievements, controversies, etc.).';
comment on table asset_declarations is 'INEC/CCB asset declarations submitted by candidates.';
comment on table speeches           is 'Recorded speeches with multilingual transcripts (EN/HA/YO/IG).';
comment on table fact_checks        is 'Fact-check verdicts on specific public claims made by candidates.';

comment on column candidates.education       is 'JSONB array of {institution, degree, field?, year_start?, year_end?}';
comment on column candidates.search_vector   is 'Maintained by trigger update_candidate_search_vector; used for FTS.';
comment on column asset_declarations.properties  is 'JSONB array of {description, location, estimated_value_naira?}';
comment on column asset_declarations.vehicles    is 'JSONB array of {make, model, year?, estimated_value_naira?}';
comment on column asset_declarations.cash        is 'JSONB array of {currency, amount, institution?}';
comment on column asset_declarations.liabilities is 'JSONB array of {description, creditor, amount_naira}';
