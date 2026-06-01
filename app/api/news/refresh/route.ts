/**
 * POST /api/news/refresh
 *
 * Triggers the full news pipeline: NewsAPI fetch → Claude enrichment → Supabase upsert.
 * Protected by a simple bearer token (NEWS_REFRESH_SECRET env var).
 * Can be called from a cron job, a Cloudflare Cron Trigger, or the admin UI.
 */

import { NextResponse } from 'next/server';
import { refreshNewsAction } from '@/app/actions/news';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Simple token auth — set NEWS_REFRESH_SECRET in env to protect the endpoint
  const secret = process.env.NEWS_REFRESH_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const result = await refreshNewsAction();

  return NextResponse.json({
    ok:      !result.error,
    ...result,
    ts:      new Date().toISOString(),
  });
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: '/api/news/refresh' });
}
