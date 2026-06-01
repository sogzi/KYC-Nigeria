/**
 * NewsAPI.org client
 *
 * Free tier: 100 req/day, last 30 days of news, no full content.
 * Get a free key at https://newsapi.org/register
 *
 * Set NEWSAPI_KEY in your .env.local and Cloudflare environment variables.
 */

export interface RawArticle {
  id: string;           // SHA-1 of URL (stable dedup key)
  title: string;
  description: string | null;
  url: string;
  source_name: string | null;
  author: string | null;
  published_at: string | null;
  image_url: string | null;
}

interface NewsApiArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

/** Stable 8-char ID from URL (avoids duplicates on re-fetch) */
function urlToId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const chr = url.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36).padStart(8, '0');
}

const QUERIES = [
  'Nigeria election 2027',
  'Nigeria presidential candidate 2027',
  'APC PDP Nigeria 2027',
  'INEC Nigeria election',
];

/**
 * Fetch the latest Nigeria election news from NewsAPI.
 * Returns [] if NEWSAPI_KEY is not set (graceful degradation).
 */
export async function fetchNigeriaElectionNews(): Promise<RawArticle[]> {
  const key = process.env.NEWSAPI_KEY;
  if (!key) {
    console.warn('[newsapi] NEWSAPI_KEY not set — skipping live fetch');
    return [];
  }

  const seen = new Set<string>();
  const results: RawArticle[] = [];

  for (const q of QUERIES) {
    try {
      const url = new URL('https://newsapi.org/v2/everything');
      url.searchParams.set('q', q);
      url.searchParams.set('language', 'en');
      url.searchParams.set('sortBy', 'publishedAt');
      url.searchParams.set('pageSize', '10');
      url.searchParams.set('apiKey', key);

      const res = await fetch(url.toString(), {
        next: { revalidate: 0 }, // always fresh in the pipeline
      });

      if (!res.ok) {
        console.error(`[newsapi] ${res.status} for query "${q}"`);
        continue;
      }

      const data: NewsApiResponse = await res.json();

      for (const a of data.articles ?? []) {
        if (!a.url || seen.has(a.url)) continue;
        if (a.title === '[Removed]') continue;
        seen.add(a.url);

        results.push({
          id: urlToId(a.url),
          title: a.title,
          description: a.description ?? null,
          url: a.url,
          source_name: a.source?.name ?? null,
          author: a.author ?? null,
          published_at: a.publishedAt ?? null,
          image_url: a.urlToImage ?? null,
        });
      }
    } catch (err) {
      console.error(`[newsapi] fetch error for "${q}":`, err);
    }
  }

  return results;
}
