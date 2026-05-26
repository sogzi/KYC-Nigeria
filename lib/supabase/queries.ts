import { createClient } from './server';
import type { CandidateProfile, Row } from '@/types';

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
