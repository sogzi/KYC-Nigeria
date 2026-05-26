import { createClient } from './server';
import type {
  CandidateProfile, Row, CandidateCard,
  CandidateListItem, CandidateFilters,
} from '@/types';

/**
 * Fetch a full candidate profile with all related tables.
 * Each sub-table is queried in parallel for minimal latency.
 */
export async function getCandidateProfile(
  id: string,
): Promise<{ data: CandidateProfile | null; error: string | null }> {
  const supabase = createClient();

  // Fetch the candidate row first — bail early if not found
  const { data: candidate, error: candidateError } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', id)
    .single();

  if (candidateError || !candidate) {
    return {
      data: null,
      error: candidateError?.message ?? 'Candidate not found',
    };
  }

  // Fetch all related tables in parallel
  const [manifestosRes, trackRes, assetsRes, speechesRes, factsRes] =
    await Promise.all([
      supabase
        .from('manifestos')
        .select('*')
        .eq('candidate_id', id)
        .order('category'),
      supabase
        .from('track_records')
        .select('*')
        .eq('candidate_id', id)
        .order('year', { ascending: false }),
      supabase
        .from('asset_declarations')
        .select('*')
        .eq('candidate_id', id)
        .order('declaration_year', { ascending: false }),
      supabase
        .from('speeches')
        .select('*')
        .eq('candidate_id', id)
        .order('date', { ascending: false }),
      supabase
        .from('fact_checks')
        .select('*')
        .eq('candidate_id', id)
        .order('checked_at', { ascending: false }),
    ]);

  // Cast through Row<'candidates'> first to satisfy TS spread narrowing,
  // then build the full profile shape.
  const base = candidate as Row<'candidates'>;

  return {
    data: {
      ...base,
      manifestos: manifestosRes.data ?? [],
      track_records: trackRes.data ?? [],
      asset_declarations: assetsRes.data ?? [],
      speeches: speechesRes.data ?? [],
      fact_checks: factsRes.data ?? [],
    } as CandidateProfile,
    error: null,
  };
}

// ── Comparison queries ────────────────────────────────────────────────────────

/** Lightweight list of all candidates — used to populate the comparison selector. */
export async function getAllCandidatesLight(): Promise<CandidateCard[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('candidates')
    .select(
      'id, full_name, photo_url, party_affiliation, election_type, state, constituency, current_position, is_verified',
    )
    .order('full_name');
  return (data ?? []) as CandidateCard[];
}

// ── Listing / filter queries ──────────────────────────────────────────────────

/**
 * Fetch candidates for the listing page with filter support.
 *
 * Joins asset_declarations (count) and fact_checks (verdict) inline so the
 * caller can compute has_assets and fact_check_score without extra round-trips.
 *
 * Post-processing filters (has_assets, min_score) are applied in TypeScript
 * to avoid complex SQL that supabase-js can't express cleanly.
 */
export async function getFilteredCandidates(
  filters: CandidateFilters = {},
): Promise<CandidateListItem[]> {
  const supabase = createClient();

  type RawRow = Row<'candidates'> & {
    asset_declarations: { id: string }[];
    fact_checks: { verdict: string }[];
  };

  // Build base query
  let query = supabase
    .from('candidates')
    .select(
      'id, full_name, photo_url, party_affiliation, election_type, state, constituency, current_position, is_verified, search_vector, asset_declarations(id), fact_checks(verdict)',
    )
    .order('full_name');

  // DB-level filters (indexed, cheap)
  if (filters.election_type) {
    query = query.eq('election_type', filters.election_type);
  }
  if (filters.state) {
    query = query.eq('state', filters.state);
  }
  if (filters.party) {
    query = query.ilike('party_affiliation', `%${filters.party}%`);
  }
  // Name / keyword search (uses the existing tsvector)
  if (filters.q && filters.q.trim()) {
    query = query.textSearch('search_vector', filters.q.trim(), {
      type: 'plain',
      config: 'english',
    });
  }

  const { data } = await query;
  const rows = (data ?? []) as unknown as RawRow[];

  // Application-layer post-filters
  return rows
    .map((c): CandidateListItem => {
      const has_assets        = c.asset_declarations.length > 0;
      const totalFacts        = c.fact_checks.length;
      const trueFacts         = c.fact_checks.filter((f) => f.verdict === 'true').length;
      const fact_check_score  = totalFacts > 0
        ? Math.round((trueFacts / totalFacts) * 100)
        : null;

      return {
        id:               c.id,
        full_name:        c.full_name,
        photo_url:        c.photo_url,
        party_affiliation: c.party_affiliation,
        election_type:    c.election_type,
        state:            c.state,
        constituency:     c.constituency,
        current_position: c.current_position,
        is_verified:      c.is_verified,
        has_assets,
        fact_check_score,
      };
    })
    .filter((c) => {
      if (filters.has_assets === 'yes' && !c.has_assets) return false;
      if (filters.has_assets === 'no'  &&  c.has_assets) return false;
      if (filters.min_score) {
        const threshold = Number(filters.min_score);
        if (c.fact_check_score === null || c.fact_check_score < threshold) return false;
      }
      return true;
    });
}

// ── Global search ─────────────────────────────────────────────────────────────

export type SearchResultCandidate = Pick<
  Row<'candidates'>,
  'id' | 'full_name' | 'photo_url' | 'party_affiliation' | 'election_type' | 'state'
>;

export type SearchResultManifesto = Pick<
  Row<'manifestos'>,
  'id' | 'section_title' | 'content' | 'category' | 'candidate_id'
> & { candidate_name: string };

export type SearchResultSpeech = Pick<
  Row<'speeches'>,
  'id' | 'title' | 'date' | 'candidate_id'
> & { candidate_name: string };

export interface GlobalSearchResults {
  candidates: SearchResultCandidate[];
  manifestos: SearchResultManifesto[];
  speeches:   SearchResultSpeech[];
  query:      string;
}

const SEARCH_LIMIT = 5;

/**
 * Run parallel full-text search across candidates, manifestos, and speeches.
 * Returns at most `SEARCH_LIMIT` results per group.
 */
export async function globalSearch(rawQuery: string): Promise<GlobalSearchResults> {
  const q = rawQuery.trim();
  if (!q) {
    return { candidates: [], manifestos: [], speeches: [], query: q };
  }

  const supabase = createClient();

  const [candRes, manifRes, speechRes] = await Promise.all([
    // ── Candidates ───────────────────────────────────────────────────────────
    supabase
      .from('candidates')
      .select('id, full_name, photo_url, party_affiliation, election_type, state')
      .textSearch('search_vector', q, { type: 'plain', config: 'english' })
      .limit(SEARCH_LIMIT),

    // ── Manifestos ───────────────────────────────────────────────────────────
    supabase
      .from('manifestos')
      .select('id, section_title, content, category, candidate_id, candidates(full_name)')
      .textSearch('search_vector', q, { type: 'plain', config: 'english' })
      .limit(SEARCH_LIMIT),

    // ── Speeches ─────────────────────────────────────────────────────────────
    supabase
      .from('speeches')
      .select('id, title, date, candidate_id, candidates(full_name)')
      .textSearch('search_vector', q, { type: 'plain', config: 'english' })
      .limit(SEARCH_LIMIT),
  ]);

  type ManifRow = {
    id: string; section_title: string; content: string;
    category: string; candidate_id: string;
    candidates: { full_name: string } | null;
  };
  type SpeechRow = {
    id: string; title: string; date: string;
    candidate_id: string;
    candidates: { full_name: string } | null;
  };

  const manifestos = ((manifRes.data ?? []) as unknown as ManifRow[]).map((m) => ({
    id:            m.id,
    section_title: m.section_title,
    content:       m.content,
    category:      m.category as Row<'manifestos'>['category'],
    candidate_id:  m.candidate_id,
    candidate_name: m.candidates?.full_name ?? 'Unknown candidate',
  }));

  const speeches = ((speechRes.data ?? []) as unknown as SpeechRow[]).map((s) => ({
    id:             s.id,
    title:          s.title,
    date:           s.date,
    candidate_id:   s.candidate_id,
    candidate_name: s.candidates?.full_name ?? 'Unknown candidate',
  }));

  return {
    candidates: (candRes.data ?? []) as SearchResultCandidate[],
    manifestos,
    speeches,
    query: q,
  };
}

/** Helper: group an array of objects by a string key. */
function groupBy<T extends Record<string, unknown>>(
  arr: T[],
  key: keyof T,
): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = String(item[key]);
    (acc[k] ??= []).push(item);
    return acc;
  }, {});
}

/**
 * Fetch full profiles for up to 3 candidates in a single round-trip per table.
 * Returns candidates in the same order as the input IDs array.
 */
export async function getCandidatesForComparison(
  ids: string[],
): Promise<CandidateProfile[]> {
  if (!ids.length) return [];

  const supabase = createClient();

  const [candidatesRes, manifestosRes, trackRes, assetsRes, speechesRes, factsRes] =
    await Promise.all([
      supabase.from('candidates').select('*').in('id', ids),
      supabase.from('manifestos').select('*').in('candidate_id', ids).order('category'),
      supabase
        .from('track_records')
        .select('*')
        .in('candidate_id', ids)
        .order('year', { ascending: false }),
      supabase
        .from('asset_declarations')
        .select('*')
        .in('candidate_id', ids)
        .order('declaration_year', { ascending: false }),
      supabase.from('speeches').select('*').in('candidate_id', ids).order('date', { ascending: false }),
      supabase.from('fact_checks').select('*').in('candidate_id', ids),
    ]);

  // Cast to Row<'candidates'>[] so TS can resolve .id and spread correctly
  const candidateRows = (candidatesRes.data ?? []) as Row<'candidates'>[];
  const manifByCand  = groupBy(manifestosRes.data ?? [], 'candidate_id');
  const trackByCand  = groupBy(trackRes.data ?? [], 'candidate_id');
  const assetsByCand = groupBy(assetsRes.data ?? [], 'candidate_id');
  const speechByCand = groupBy(speechesRes.data ?? [], 'candidate_id');
  const factsByCand  = groupBy(factsRes.data ?? [], 'candidate_id');

  // Return in requested order, skip any IDs not found
  return ids
    .map((id) => candidateRows.find((c) => c.id === id))
    .filter((c): c is Row<'candidates'> => !!c)
    .map((c) => ({
      ...c,
      manifestos:         manifByCand[c.id]  ?? [],
      track_records:      trackByCand[c.id]  ?? [],
      asset_declarations: assetsByCand[c.id] ?? [],
      speeches:           speechByCand[c.id] ?? [],
      fact_checks:        factsByCand[c.id]  ?? [],
    })) as CandidateProfile[];
}
