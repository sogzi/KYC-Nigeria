/**
 * POST /api/pipeline
 * GET  /api/pipeline  (health / status check)
 *
 * Triggers the Claude-first candidate data pipeline.
 * Claude generates profiles directly from its training knowledge.
 *
 * Authentication:
 *   Set PIPELINE_SECRET in Cloudflare env vars.
 *   Requests must include:  Authorization: Bearer <PIPELINE_SECRET>
 *   If PIPELINE_SECRET is not set, the endpoint is disabled entirely.
 *
 * Body (optional JSON):
 *   { "slugs": ["bola-tinubu", "peter-obi"] }  — run only these candidates
 *   {}                                           — run ALL seed candidates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { SEED_CANDIDATES } from '@/lib/candidates/seed-list';
import { runBulkCandidatePipeline } from '@/lib/candidates/pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Auth helper ───────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.PIPELINE_SECRET;
  if (!secret) return false;   // disabled if secret not configured

  const auth = req.headers.get('authorization') ?? '';
  if (auth.startsWith('Bearer ')) {
    return auth.slice(7).trim() === secret;
  }

  // Also accept ?secret=xxx for cron services that can't set headers
  const urlSecret = req.nextUrl.searchParams.get('secret');
  return urlSecret === secret;
}

// ── GET: health check ─────────────────────────────────────────────────────────

export async function GET() {
  const hasSecret = !!process.env.PIPELINE_SECRET;
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;

  return NextResponse.json({
    ok: true,
    pipeline: 'candidates',
    totalSeeds: SEED_CANDIDATES.length,
    configured: {
      PIPELINE_SECRET:   hasSecret,
      ANTHROPIC_API_KEY: hasAnthropicKey,
      SUPABASE_URL:      !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
}

// ── POST: run pipeline ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth check
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized. Set PIPELINE_SECRET and pass it as Bearer token.' },
      { status: 401 },
    );
  }

  // Parse optional body
  let slugFilter: string[] | null = null;
  try {
    const body = await req.json() as { slugs?: string[] };
    if (Array.isArray(body.slugs) && body.slugs.length > 0) {
      slugFilter = body.slugs;
    }
  } catch {
    // no body or invalid JSON — run all seeds
  }

  // Filter seeds
  const seeds = slugFilter
    ? SEED_CANDIDATES.filter((s) => slugFilter!.includes(s.slug))
    : SEED_CANDIDATES;

  if (!seeds.length) {
    return NextResponse.json(
      { ok: false, error: 'No matching candidates found for the provided slugs.' },
      { status: 400 },
    );
  }

  console.log(`[pipeline/route] Starting pipeline for ${seeds.length} candidate(s)`);

  // When running the full pipeline (no slug filter), wipe unverified placeholder
  // candidates first so fake demo data doesn't linger alongside real profiles.
  if (!slugFilter) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createAdminClient() as any;
      const { error: delErr } = await supabase
        .from('candidates')
        .delete()
        .eq('is_verified', false);
      if (delErr) {
        console.warn('[pipeline/route] Could not purge unverified candidates:', delErr.message);
      } else {
        console.log('[pipeline/route] Purged unverified placeholder candidates');
      }
    } catch (e) {
      console.warn('[pipeline/route] Purge step failed (non-fatal):', e);
    }
  }

  try {
    const result = await runBulkCandidatePipeline(seeds, (r, i, total) => {
      console.log(`[pipeline/route] [${i + 1}/${total}] ${r.slug}: ${r.status}${r.message ? ` — ${r.message}` : ''}`);
    });

    return NextResponse.json({
      ok:         result.errors === 0 || result.ok > 0,
      ok_count:   result.ok,
      skipped:    result.skipped,
      errors:     result.errors,
      duration_ms: result.durationMs,
      details:    result.details.map((d) => ({
        slug:        d.slug,
        status:      d.status,
        candidateId: d.candidateId,
        message:     d.message,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown pipeline error';
    console.error('[pipeline/route] Fatal error:', err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
