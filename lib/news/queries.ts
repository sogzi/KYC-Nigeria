/**
 * Supabase read/write queries for the news_articles table.
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { NewsArticle, NewsArticleInsert } from '@/types';

export interface NewsFilters {
  policy_tag?:  string;
  sentiment?:   string;
  candidate?:   string;
  limit?:       number;
  offset?:      number;
}

/** Fetch articles from Supabase, newest first, with optional filters. */
export async function getNewsArticles(
  filters: NewsFilters = {},
): Promise<NewsArticle[]> {
  const supabase = createAdminClient();
  const { limit = 30, offset = 0 } = filters;

  let query = supabase
    .from('news_articles')
    .select('*')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.sentiment) {
    query = query.eq('sentiment', filters.sentiment);
  }
  if (filters.policy_tag) {
    query = query.contains('policy_tags', [filters.policy_tag]);
  }
  if (filters.candidate) {
    query = query.contains('candidates_mentioned', [filters.candidate]);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[news/queries] getNewsArticles error:', error.message);
    return [];
  }
  return (data ?? []) as NewsArticle[];
}

/** Insert or update articles (upsert on id). */
export async function upsertNewsArticles(
  articles: NewsArticleInsert[],
): Promise<{ inserted: number; error: string | null }> {
  if (!articles.length) return { inserted: 0, error: null };

  const supabase = createAdminClient();

  // Upsert without chaining select — avoids TS type-narrowing bug with upsert+select
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('news_articles')
    .upsert(articles, { onConflict: 'id', ignoreDuplicates: false });

  if (error) return { inserted: 0, error: (error as { message: string }).message };
  return { inserted: articles.length, error: null };
}

/** How many articles are in the DB (used to show "last refreshed" info). */
export async function getNewsStats(): Promise<{ total: number; lastFetched: string | null }> {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from('news_articles')
    .select('id', { count: 'exact', head: true });

  const { data } = await supabase
    .from('news_articles')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  const row = data?.[0] as { created_at: string } | undefined;

  return {
    total: count ?? 0,
    lastFetched: row?.created_at ?? null,
  };
}
