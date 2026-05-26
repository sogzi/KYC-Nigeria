/**
 * GET /api/search?q=…
 *
 * Returns up to 5 candidates, 5 manifesto points, and 5 speeches matching the
 * full-text query. Results are sorted by relevance (Supabase / Postgres ranks
 * tsvector matches for us).
 */

import { NextResponse } from 'next/server';
import { globalSearch } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (!q || q.length < 2) {
    return NextResponse.json(
      { candidates: [], manifestos: [], speeches: [], query: q },
      { status: 200 },
    );
  }

  try {
    const results = await globalSearch(q);
    return NextResponse.json(results, {
      status: 200,
      headers: {
        // Cache for 30 s on Vercel edge — short enough to stay fresh, long
        // enough to absorb burst traffic on popular search terms.
        'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (err) {
    console.error('[search] Error:', err);
    return NextResponse.json({ error: 'Search failed.' }, { status: 500 });
  }
}
