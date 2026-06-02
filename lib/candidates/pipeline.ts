/**
 * Automated candidate data pipeline:
 *   Wikipedia (free, no-auth) → Claude Haiku (structure + enrich) → Supabase
 *
 * Flow for each candidate:
 *  1. Fetch full Wikipedia extract (10 kB of plain text)
 *  2. Send to Claude Haiku with a strict JSON schema prompt
 *  3. Parse the JSON response into DB row shapes
 *  4. Upsert candidate + manifesto points + track records into Supabase
 *
 * The pipeline is idempotent: running it again only updates changed fields.
 * All AI-generated records are flagged is_verified = false until a human
 * reviews them in the admin UI.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/server';
import { fetchWikiExtract, fetchWikiSummary, searchWikiTitle } from './wikipedia';
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

// ── Claude prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Nigerian political researcher. Given a Wikipedia article about a Nigerian politician, extract structured data and return ONLY valid JSON — no markdown fences, no prose, just the JSON object.

Your JSON must match this exact schema:
{
  "full_name": "string",
  "date_of_birth": "YYYY-MM-DD or null",
  "state_of_origin": "Nigerian state name or null",
  "local_government": "LGA name or null",
  "biography": "3–5 sentence factual biography",
  "education": [
    { "institution": "string", "degree": "string", "field": "string or null", "year_end": number or null }
  ],
  "manifesto_points": [
    {
      "category": one of ["economy","security","education","healthcare","infrastructure","corruption"],
      "section_title": "short title e.g. 'Economic Policy'",
      "content": "2–4 sentence summary of their stated policy position or track record in this area"
    }
  ],
  "track_records": [
    {
      "year": number,
      "title": "short event title",
      "description": "1–3 sentences",
      "record_type": one of ["achievement","controversy","conviction","policy","appointment"],
      "source_url": null
    }
  ]
}

Rules:
- Include 2–5 manifesto_points covering different policy categories
- Include 3–8 track_records of notable events in their career
- If data is unavailable for a field, use null (not empty string)
- Do NOT invent facts. Only use what is in the provided Wikipedia text
- Biography must be in the third person
- Keep all content factual and neutral`;

function buildUserPrompt(seed: SeedCandidate, wikiText: string): string {
  return `Wikipedia article about ${seed.full_name} (${seed.party_affiliation}, ${seed.election_type}):

---
${wikiText}
---

Extract the structured profile JSON per the schema above.`;
}

// ── Claude extraction ─────────────────────────────────────────────────────────

async function extractProfileWithClaude(
  seed: SeedCandidate,
  wikiText: string,
): Promise<PipelineProfile | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 2048,
    system:     SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: buildUserPrompt(seed, wikiText) }],
  });

  const block = message.content[0];
  if (!block || block.type !== 'text') {
    console.error(`[pipeline] Claude returned no text block for ${seed.slug}`);
    return null;
  }

  try {
    // Strip any accidental markdown fences
    const raw  = block.text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    const parsed = JSON.parse(raw) as PipelineProfile;
    return parsed;
  } catch (err) {
    console.error(`[pipeline] JSON parse error for ${seed.slug}:`, err, '\nRaw:', block.text.slice(0, 300));
    return null;
  }
}

// ── Supabase upsert ───────────────────────────────────────────────────────────

async function upsertToSupabase(
  seed: SeedCandidate,
  profile: PipelineProfile,
  wikiPageUrl: string | null,
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
    console.error(`[pipeline] candidate upsert error (${seed.slug}):`, candidateErr.message);
    return null;
  }

  const candidateId = (upserted as Array<{ id: string }>)?.[0]?.id;
  if (!candidateId) {
    console.error(`[pipeline] no candidate id returned for ${seed.slug}`);
    return null;
  }

  // 2. Delete + re-insert manifesto points (simpler than diffing)
  if (profile.manifesto_points?.length) {
    await supabase
      .from('manifestos')
      .delete()
      .eq('candidate_id', candidateId);

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
    await supabase
      .from('track_records')
      .delete()
      .eq('candidate_id', candidateId);

    const trackRows = profile.track_records.map((tr) => ({
      candidate_id:       candidateId,
      year:               tr.year,
      title:              tr.title,
      description:        tr.description,
      record_type:        tr.record_type,
      source_url:         wikiPageUrl ?? tr.source_url ?? null,
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

/**
 * Run the full pipeline for one candidate seed.
 * Returns a result object indicating success, skip, or error.
 */
export async function runCandidatePipeline(
  seed: SeedCandidate,
): Promise<PipelineResult> {
  console.log(`[pipeline] Processing: ${seed.full_name} (${seed.slug})`);

  // 1. Fetch Wikipedia content
  let extract = await fetchWikiExtract(seed.wikipedia_title);
  let pageUrl: string | null = null;

  if (!extract) {
    // Fallback: try searching for the right page title
    console.log(`[pipeline] Exact title not found, searching Wikipedia for: ${seed.full_name}`);
    const foundTitle = await searchWikiTitle(seed.full_name);
    if (foundTitle) {
      extract = await fetchWikiExtract(foundTitle);
    }
  }

  if (!extract || !extract.fullText) {
    // Last resort: use the short summary
    const summary = await fetchWikiSummary(seed.wikipedia_title);
    if (!summary?.extract) {
      return { slug: seed.slug, candidateId: null, status: 'skipped', message: 'No Wikipedia content found' };
    }
    extract = {
      title:    summary.title,
      fullText: summary.extract,
      pageUrl:  summary.content_urls?.desktop.page ?? null,
    };
  }

  // extract is guaranteed non-null after the guard above
  pageUrl = extract!.pageUrl;

  // 2. Extract structured profile via Claude
  let profile: PipelineProfile | null = null;
  try {
    profile = await extractProfileWithClaude(seed, extract!.fullText);
  } catch (err) {
    return {
      slug:        seed.slug,
      candidateId: null,
      status:      'error',
      message:     err instanceof Error ? err.message : 'Claude extraction failed',
    };
  }

  if (!profile) {
    return { slug: seed.slug, candidateId: null, status: 'error', message: 'Claude returned null profile' };
  }

  // Also try to pull a photo URL from Wikipedia summary
  try {
    const summary = await fetchWikiSummary(seed.wikipedia_title);
    if (summary?.thumbnail?.source) {
      profile.photo_url = summary.thumbnail.source;
    }
  } catch {
    // non-fatal
  }

  // 3. Persist to Supabase
  let candidateId: string | null = null;
  try {
    candidateId = await upsertToSupabase(seed, profile, pageUrl);
  } catch (err) {
    return {
      slug:        seed.slug,
      candidateId: null,
      status:      'error',
      message:     err instanceof Error ? err.message : 'Supabase upsert failed',
    };
  }

  if (!candidateId) {
    return { slug: seed.slug, candidateId: null, status: 'error', message: 'No candidate ID returned from upsert' };
  }

  console.log(`[pipeline] ✅ ${seed.full_name} → candidateId: ${candidateId}`);
  return { slug: seed.slug, candidateId, status: 'ok' };
}

// ── Bulk pipeline ─────────────────────────────────────────────────────────────

export interface BulkPipelineResult {
  ok:      number;
  skipped: number;
  errors:  number;
  details: PipelineResult[];
  durationMs: number;
}

/**
 * Run the pipeline for all (or a subset of) seed candidates.
 *
 * Runs sequentially to avoid rate-limiting Wikipedia and Claude.
 * Adds a 500ms pause between each candidate.
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

    // Rate-limit pause between candidates (except last)
    if (i < seeds.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
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
