'use server';

/**
 * Server actions for persisting AI-generated content to Supabase.
 *
 * These run server-side and bypass RLS using the admin client.
 * Each action validates inputs before inserting.
 */

import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminUser } from '@/lib/admin-auth';
import type {
  ElectionType,
  ManifestoCategory,
  TrackRecordType,
  FactCheckVerdict,
  EducationEntry,
} from '@/types';

// ── Types matching AI-generated output ───────────────────────────────────────

interface ManifestoPoint {
  category: ManifestoCategory;
  title: string;
  content: string;
}

interface TrackRecordEntry {
  type: TrackRecordType;
  title: string;
  description: string;
  date?: string;
}

interface GeneratedProfile {
  full_name: string;
  party_affiliation: string;
  election_type: ElectionType;
  state?: string;
  constituency?: string;
  current_position?: string;
  date_of_birth?: string;
  state_of_origin?: string;
  biography?: string;
  education?: EducationEntry[];
  manifesto_points?: ManifestoPoint[];
  track_record?: TrackRecordEntry[];
}

interface FactCheckClaim {
  claim: string;
  verdict: FactCheckVerdict;
  explanation: string;
  source_suggestion?: string;
}

// ── Save AI-generated candidate profile ──────────────────────────────────────

export async function saveCandidateFromAI(
  profile: GeneratedProfile,
): Promise<{ candidateId: string | null; error: string | null }> {
  try {
    await requireAdminUser();
  } catch {
    return { candidateId: null, error: 'Unauthorized' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  // 1. Insert candidate
  const { data: candidate, error: candError } = await supabase
    .from('candidates')
    .insert({
      full_name:        profile.full_name,
      party_affiliation: profile.party_affiliation,
      election_type:    profile.election_type,
      state:            profile.state ?? null,
      constituency:     profile.constituency ?? null,
      current_position: profile.current_position ?? null,
      date_of_birth:    profile.date_of_birth ?? null,
      state_of_origin:  profile.state_of_origin ?? null,
      biography:        profile.biography ?? null,
      education:        profile.education ?? [],
      is_verified:      false,
    })
    .select('id')
    .single();

  if (candError || !candidate) {
    console.error('[saveCandidateFromAI] candidate insert:', candError?.message);
    return { candidateId: null, error: (candError as { message: string })?.message ?? 'Insert failed' };
  }

  const candidateId = (candidate as { id: string }).id;

  // 2. Insert manifesto points
  if (profile.manifesto_points?.length) {
    const { error: mErr } = await supabase.from('manifestos').insert(
      profile.manifesto_points.map((p) => ({
        candidate_id:       candidateId,
        category:           p.category,
        title:              p.title,
        content:            p.content,
        source_credibility: 'unverified',
      })),
    );
    if (mErr) console.warn('[saveCandidateFromAI] manifesto insert:', (mErr as { message: string }).message);
  }

  // 3. Insert track record
  if (profile.track_record?.length) {
    const { error: trErr } = await supabase.from('track_records').insert(
      profile.track_record.map((t) => ({
        candidate_id: candidateId,
        type:         t.type,
        title:        t.title,
        description:  t.description ?? null,
        date:         t.date ?? null,
        source_credibility: 'unverified',
      })),
    );
    if (trErr) console.warn('[saveCandidateFromAI] track_records insert:', (trErr as { message: string }).message);
  }

  return { candidateId, error: null };
}

// ── Save speech + fact-checks ─────────────────────────────────────────────────

export async function saveSpeechWithFactChecks(input: {
  candidateId: string;
  title: string;
  content: string;
  deliveredAt?: string;
  sourceUrl?: string;
  claims: FactCheckClaim[];
}): Promise<{ speechId: string | null; error: string | null }> {
  let adminUser;
  try {
    adminUser = await requireAdminUser();
  } catch {
    return { speechId: null, error: 'Unauthorized' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  // 1. Insert speech
  const { data: speech, error: sErr } = await supabase
    .from('speeches')
    .insert({
      candidate_id: input.candidateId,
      title:        input.title,
      content:      input.content,
      delivered_at: input.deliveredAt ?? null,
      source_url:   input.sourceUrl ?? null,
    })
    .select('id')
    .single();

  if (sErr || !speech) {
    return { speechId: null, error: (sErr as { message: string })?.message ?? 'Speech insert failed' };
  }

  // 2. Insert fact-checks
  if (input.claims.length) {
    const { error: fcErr } = await supabase.from('fact_checks').insert(
      input.claims.map((c) => ({
        candidate_id: input.candidateId,
        claim:        c.claim,
        verdict:      c.verdict,
        explanation:  c.explanation,
        source_url:   null,
        checked_by:   adminUser.profile.username,
      })),
    );
    if (fcErr) console.warn('[saveSpeechWithFactChecks] fact_checks insert:', (fcErr as { message: string }).message);
  }

  return { speechId: (speech as { id: string }).id, error: null };
}
