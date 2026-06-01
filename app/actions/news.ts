'use server';

/**
 * Server action: orchestrates the full news refresh pipeline.
 *   1. Fetch raw articles from NewsAPI.org
 *   2. Enrich with Claude AI (summary, candidates, policy tags, sentiment)
 *   3. Upsert into Supabase news_articles table
 *
 * Falls back gracefully when API keys are absent (returns sample data flag).
 */

import { fetchNigeriaElectionNews } from '@/lib/news/newsapi';
import { enrichArticles }          from '@/lib/news/enrichment';
import { upsertNewsArticles }       from '@/lib/news/queries';
import type { NewsArticleInsert }  from '@/types';

export interface RefreshResult {
  fetched:  number;
  enriched: number;
  upserted: number;
  error:    string | null;
}

export async function refreshNewsAction(): Promise<RefreshResult> {
  try {
    // 1. Fetch raw articles (returns [] if NEWSAPI_KEY not set)
    const rawArticles = await fetchNigeriaElectionNews();

    if (!rawArticles.length) {
      return { fetched: 0, enriched: 0, upserted: 0, error: null };
    }

    // 2. AI enrichment (skips gracefully if ANTHROPIC_API_KEY not set)
    const enrichmentMap = await enrichArticles(rawArticles);

    // 3. Build insert records
    const now = new Date().toISOString();
    const inserts: NewsArticleInsert[] = rawArticles.map((a) => {
      const enriched = enrichmentMap.get(a.id);
      return {
        id:           a.id,
        title:        a.title,
        description:  a.description ?? null,
        url:          a.url,
        source_name:  a.source_name ?? null,
        author:       a.author ?? null,
        published_at: a.published_at ?? null,
        image_url:    a.image_url ?? null,

        // AI fields (null if enrichment unavailable)
        ai_summary:           enriched?.ai_summary           ?? null,
        candidates_mentioned: enriched?.candidates_mentioned ?? [],
        policy_tags:          enriched?.policy_tags          ?? [],
        sentiment:            enriched?.sentiment            ?? null,
        ai_enriched_at:       enriched ? now : null,

        created_at: now,
        updated_at: now,
      };
    });

    // 4. Upsert into DB
    const { inserted, error } = await upsertNewsArticles(inserts);

    if (error) {
      return { fetched: rawArticles.length, enriched: enrichmentMap.size, upserted: 0, error };
    }

    return {
      fetched:  rawArticles.length,
      enriched: enrichmentMap.size,
      upserted: inserted,
      error:    null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[refreshNewsAction]', msg);
    return { fetched: 0, enriched: 0, upserted: 0, error: msg };
  }
}
