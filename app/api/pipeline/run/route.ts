/**
 * GET /api/pipeline/run?secret=YOUR_PIPELINE_SECRET
 *
 * Browser-friendly trigger for the candidate data pipeline.
 * Open this URL directly — no admin login needed.
 *
 * Returns an HTML progress page so you can watch results in real time.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { SEED_CANDIDATES } from '@/lib/candidates/seed-list';
import { runBulkCandidatePipeline } from '@/lib/candidates/pipeline';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.PIPELINE_SECRET;
  if (!secret) return false;
  const provided = req.nextUrl.searchParams.get('secret') ?? '';
  return provided === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:2rem">
        <h2>❌ Unauthorized</h2>
        <p>Add <code>?secret=YOUR_PIPELINE_SECRET</code> to the URL.</p>
        <p>Make sure <code>PIPELINE_SECRET</code> is set in your Cloudflare environment variables.</p>
      </body></html>`,
      { status: 401, headers: { 'Content-Type': 'text/html' } },
    );
  }

  const startTime = Date.now();
  const lines: string[] = [];

  const log = (msg: string) => {
    console.log(msg);
    lines.push(msg);
  };

  log(`🚀 Starting candidate pipeline — ${SEED_CANDIDATES.length} candidates`);
  log(`⏱  Started at ${new Date().toISOString()}`);
  log('');

  // Purge unverified placeholder candidates first
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;
    await supabase.from('candidates').delete().eq('is_verified', false);
    log('🗑  Cleared placeholder candidates');
  } catch {
    log('⚠️  Could not clear placeholders (non-fatal)');
  }

  // Run the pipeline
  const result = await runBulkCandidatePipeline(SEED_CANDIDATES, (r, i, total) => {
    const icon = r.status === 'ok' ? '✅' : r.status === 'skipped' ? '⏭️' : '❌';
    log(`${icon} [${i + 1}/${total}] ${r.slug}${r.message ? ` — ${r.message}` : ''}`);
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  log('');
  log(`✅ Done in ${duration}s`);
  log(`   Synced: ${result.ok} | Skipped: ${result.skipped} | Errors: ${result.errors}`);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pipeline Complete — NaijaVote</title>
  <style>
    body { font-family: monospace; background: #0f1117; color: #e2e8f0; padding: 2rem; max-width: 800px; margin: 0 auto; }
    h1 { font-family: sans-serif; color: #22c55e; }
    pre { background: #1e2330; border-radius: 8px; padding: 1.5rem; line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
    .stats { display: flex; gap: 1rem; margin: 1rem 0; font-family: sans-serif; }
    .stat { background: #1e2330; border-radius: 8px; padding: 1rem 1.5rem; text-align: center; }
    .stat-num { font-size: 2rem; font-weight: 900; }
    .ok { color: #22c55e; } .err { color: #ef4444; } .skip { color: #f59e0b; }
    a { color: #60a5fa; }
  </style>
</head>
<body>
  <h1>🇳🇬 NaijaVote — Pipeline Complete</h1>
  <div class="stats">
    <div class="stat"><div class="stat-num ok">${result.ok}</div><div>Synced</div></div>
    <div class="stat"><div class="stat-num skip">${result.skipped}</div><div>Skipped</div></div>
    <div class="stat"><div class="stat-num err">${result.errors}</div><div>Errors</div></div>
  </div>
  <pre>${lines.map(l => l.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')).join('\n')}</pre>
  <p style="font-family:sans-serif">
    <a href="/en">← View the public site</a>
  </p>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
