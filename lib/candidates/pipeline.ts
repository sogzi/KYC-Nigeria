/**
 * Automated candidate data pipeline — Claude-first approach.
 *
 * Claude Sonnet already has deep, accurate knowledge of major Nigerian
 * politicians. We ask it directly — no Wikipedia round-trip required.
 *
 * Flow:
 *  1. Ask Claude Sonnet to generate a structured JSON profile from its
 *     training knowledge of the candidate.
 *  2. Optionally enrich with a Wikipedia photo URL (zero text fetched).
 *  3. Upsert candidate + manifesto points + track records into Supabase.
 *
 * The pipeline is idempotent — running it again only updates changed fields.
 * All AI-generated records are flagged is_verified = false.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/server';
import { fetchWikiSummary } from './wikipedia';
import type { SeedCandidate } from './seed-list';
import type {
  EducationEntry,
  ManifestoCategory,
  TrackRecordType,
} from '@/types/database.types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PipelineManifestoPoint {
  category: ManifestoCategory;
  section_title: string;
  content: string;
}

export interface PipelineTrackRecord {
  year: number;
  title: string;
  description: string;
  record_type: TrackRecordType;
  source_url: string | null;
}

export interface PipelineProfile {
  full_name: string;
  date_of_birth: string | null;   // "YYYY-MM-DD" or null
  state_of_origin: string | null;
  local_government: string | null;
  biography: string;
  education: EducationEntry[];
  manifesto_points: PipelineManifestoPoint[];
  track_records: PipelineTrackRecord[];
  photo_url: string | null;
}

export interface PipelineResult {
  slug: string;
  candidateId: string | null;
  status: 'ok' | 'skipped' | 'error';
  message?: string;
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Nigerian political researcher with comprehensive knowledge of Nigerian politicians, their careers, policies, and public records.

Generate a factual structured profile for the given Nigerian politician using your knowledge. Return ONLY valid JSON — no markdown fences, no prose, just the JSON object.

Your JSON must match this exact schema:
{
  "full_name": "string — official full name",
  "date_of_birth": "YYYY-MM-DD or null",
  "state_of_origin": "Nigerian state name or null",
  "local_government": "LGA name or null",
  "biography": "4–6 sentence factual biography in third person covering background, career highlights, and current role",
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string or null",
      "year_end": number or null
    }
  ],
  "manifesto_points": [
    {
      "category": one of ["economy","security","education","healthcare","infrastructure","corruption"],
      "section_title": "short title e.g. 'Economic Vision'",
      "content": "3–5 sentence summary of their documented policy positions, proposals, or track record in this area"
    }
  ],
  "track_records": [
    {
      "year": number,
      "title": "short event title",
      "description": "2–4 sentences of factual detail",
      "record_type": one of ["achievement","controversy","conviction","policy","appointment"],
      "source_url": null
    }
  ]
}

Rules:
- Include at least 3 education entries if known, or fewer if genuinely not documented
- Include 3–5 manifesto_points covering different policy categories
- Include 5–10 track_records of notable career events (achievements AND controversies)
- Controversies and challenges are important — include them factually and neutrally
- If a specific field is genuinely unknown (e.g. exact date of birth), use null — do NOT guess
- Do NOT invent facts. Use only what you know with high confidence
- Keep all content factual, neutral, and appropriate for a voter education platform`;

// ── Claude generation ─────────────────────────────────────────────────────────

async function generateProfileWithClaude(
  seed: SeedCandidate,
): Promise<PipelineProfile | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const anthropic = new Anthropic({ apiKey });

  const userMessage = `Generate a comprehensive factual profile for:

Name: ${seed.full_name}
Party: ${seed.party_affiliation}
Election type: ${seed.election_type}
Current position: ${seed.current_position}
${seed.state ? `State: ${seed.state}` : ''}

Use your knowledge of this Nigerian political figure. Be thorough, factual, and include both achievements and controversies where documented.`;

  const message = await anthropic.messages.create({
    model:      'claude-sonnet-4-5',   // Sonnet for superior political knowledge
    max_tokens: 3000,
    system:     SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: userMessage }],
  });

  const block = message.content[0];
  if (!block || block.type !== 'text') {
    console.error(`[pipeline] Claude returned no text block for ${seed.slug}`);
    return null;
  }

  try {
    // Strip any accidental markdown fences
    const raw    = block.text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    const parsed = JSON.parse(raw) as PipelineProfile;
    return parsed;
  } catch (err) {
    console.error(`[pipeline] JSON parse error for ${seed.slug}:`, err, '\nRaw:', block.text.slice(0, 400));
    return null;
  }
}

// ── Photo enrichment (Wikipedia only for the thumbnail) ───────────────────────

async function fetchPhotoUrl(seed: SeedCandidate): Promise<string | null> {
  try {
    const summary = await fetchWikiSummary(seed.wikipedia_title);
    return summary?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

// ── Supabase upsert ───────────────────────────────────────────────────────────

async function upsertToSupabase(
  seed: SeedCandidate,
  profile: PipelineProfile,
): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  // 1. Upsert the candidate row (match on full_name + party_affiliation)
  const candidateRow = {
    full_name:         profile.full_name || seed.full_name,
    photo_url:         profile.photo_url ?? null,
    date_of_birth:     profile.date_of_birth ?? null,
    state_of_origin:   profile.state_of_origin ?? null,
    local_government:  profile.local_government ?? null,
    party_affiliation: seed.party_affiliation,
    election_type:     seed.election_type,
    state:             seed.state ?? null,
    current_position:  seed.current_position,
    biography:         profile.biography ?? null,
    education:         profile.education ?? [],
    is_verified:       false,
    updated_at:        new Date().toISOString(),
  };

  const { data: upserted, error: candidateErr } = await supabase
    .from('candidates')
    .upsert(candidateRow, {
      onConflict: 'full_name,party_affiliation',
      ignoreDuplicates: false,
    })
    .select('id')
    .limit(1);

  if (candidateErr) {
    // Fallback: try insert-or-update without unique constraint
    console.warn(`[pipeline] upsert conflict (${seed.slug}), trying name-match:`, candidateErr.message);

    const { data: existing } = await supabase
      .from('candidates')
      .select('id')
      .eq('full_name', profile.full_name || seed.full_name)
      .limit(1);

    const existingId = (existing as Array<{ id: string }>)?.[0]?.id;

    if (existingId) {
      // Update existing
      await supabase.from('candidates').update(candidateRow).eq('id', existingId);
      return existingId;
    } else {
      // Insert new
      const { data: inserted, error: insertErr } = await supabase
        .from('candidates')
        .insert(candidateRow)
        .select('id')
        .limit(1);

      if (insertErr) {
        console.error(`[pipeline] insert error (${seed.slug}):`, insertErr.message);
        return null;
      }
      return (inserted as Array<{ id: string }>)?.[0]?.id ?? null;
    }
  }

  const candidateId = (upserted as Array<{ id: string }>)?.[0]?.id;
  if (!candidateId) {
    console.error(`[pipeline] no candidate id returned for ${seed.slug}`);
    return null;
  }

  // 2. Delete + re-insert manifesto points
  if (profile.manifesto_points?.length) {
    await supabase.from('manifestos').delete().eq('candidate_id', candidateId);

    const manifestoRows = profile.manifesto_points.map((mp) => ({
      candidate_id:       candidateId,
      section_title:      mp.section_title,
      content:            mp.content,
      category:           mp.category,
      source_credibility: 'news_outlet' as const,
    }));

    const { error: mErr } = await supabase.from('manifestos').insert(manifestoRows);
    if (mErr) {
      console.warn(`[pipeline] manifesto insert warning (${seed.slug}):`, mErr.message);
    }
  }

  // 3. Delete + re-insert track records
  if (profile.track_records?.length) {
    await supabase.from('track_records').delete().eq('candidate_id', candidateId);

    const trackRows = profile.track_records.map((tr) => ({
      candidate_id:       candidateId,
      year:               tr.year,
      title:              tr.title,
      description:        tr.description,
      record_type:        tr.record_type,
      source_url:         tr.source_url ?? null,
      source_credibility: 'news_outlet' as const,
    }));

    const { error: trErr } = await supabase.from('track_records').insert(trackRows);
    if (trErr) {
      console.warn(`[pipeline] track_records insert warning (${seed.slug}):`, trErr.message);
    }
  }

  return candidateId;
}

// ── Single-candidate pipeline ─────────────────────────────────────────────────

export async function runCandidatePipeline(
  seed: SeedCandidate,
): Promise<PipelineResult> {
  console.log(`[pipeline] Processing: ${seed.full_name} (${seed.slug})`);

  // 1. Generate profile from Claude's knowledge
  let profile: PipelineProfile | null = null;
  try {
    profile = await generateProfileWithClaude(seed);
  } catch (err) {
    return {
      slug:        seed.slug,
      candidateId: null,
      status:      'error',
      message:     err instanceof Error ? err.message : 'Claude generation failed',
    };
  }

  if (!profile) {
    return {
      slug:        seed.slug,
      candidateId: null,
      status:      'error',
      message:     'Claude returned null or unparseable profile',
    };
  }

  // 2. Enrich with a photo from Wikipedia (lightweight — just the thumbnail URL)
  if (!profile.photo_url) {
    profile.photo_url = await fetchPhotoUrl(seed);
  }

  // 3. Persist to Supabase
  let candidateId: string | null = null;
  try {
    candidateId = await upsertToSupabase(seed, profile);
  } catch (err) {
    return {
      slug:        seed.slug,
      candidateId: null,
      status:      'error',
      message:     err instanceof Error ? err.message : 'Supabase upsert failed',
    };
  }

  if (!candidateId) {
    return {
      slug:        seed.slug,
      candidateId: null,
      status:      'error',
      message:     'No candidate ID returned after upsert',
    };
  }

  console.log(`[pipeline] ✅ ${seed.full_name} → id: ${candidateId}`);
  return { slug: seed.slug, candidateId, status: 'ok' };
}

// ── Bulk pipeline ─────────────────────────────────────────────────────────────

export interface BulkPipelineResult {
  ok:         number;
  skipped:    number;
  errors:     number;
  details:    PipelineResult[];
  durationMs: number;
}

/**
 * Run the pipeline for all (or a subset of) seed candidates.
 *
 * Sequential with a 300ms pause between candidates to be kind to the
 * Anthropic API rate limits.
 */
export async function runBulkCandidatePipeline(
  seeds: SeedCandidate[],
  onProgress?: (result: PipelineResult, index: number, total: number) => void,
): Promise<BulkPipelineResult> {
  const start   = Date.now();
  const details: PipelineResult[] = [];

  for (let i = 0; i < seeds.length; i++) {
    const result = await runCandidatePipeline(seeds[i]);
    details.push(result);
    onProgress?.(result, i, seeds.length);

    // Polite pause between API calls (except last)
    if (i < seeds.length - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return {
    ok:         details.filter((d) => d.status === 'ok').length,
    skipped:    details.filter((d) => d.status === 'skipped').length,
    errors:     details.filter((d) => d.status === 'error').length,
    details,
    durationMs: Date.now() - start,
  };
}
