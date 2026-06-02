/**
 * Wikipedia REST API client for fetching Nigerian politician data.
 *
 * Uses the free, no-auth-required Wikipedia REST API v1:
 *   https://en.wikipedia.org/api/rest_v1/
 *
 * Two tiers:
 *  - Summary (fast, ~1–2 kB)  → used for quick existence check + intro text
 *  - Extract (full article)   → used for deep profile generation
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WikiSummary {
  title: string;
  extract: string;        // plain-text intro paragraph(s)
  description?: string;   // short Wikidata description e.g. "Nigerian politician"
  thumbnail?: {
    source: string;       // image URL
    width: number;
    height: number;
  };
  content_urls?: {
    desktop: { page: string };
  };
}

export interface WikiExtract {
  title: string;
  /** Full article text (HTML stripped). May be several thousand characters. */
  fullText: string;
  pageUrl: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const WIKI_REST_BASE = 'https://en.wikipedia.org/api/rest_v1';
const WIKI_API_BASE  = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT     = 'NaijaVote/1.0 (https://naijavote.ng; contact@naijavote.ng)';

const HEADERS = {
  'User-Agent': USER_AGENT,
  'Accept':     'application/json',
};

// ── Summary ───────────────────────────────────────────────────────────────────

/**
 * Fetch the Wikipedia summary card for a page.
 *
 * Returns null if the page does not exist or the request fails.
 */
export async function fetchWikiSummary(
  title: string,
): Promise<WikiSummary | null> {
  const encoded = encodeURIComponent(title.replace(/ /g, '_'));
  const url     = `${WIKI_REST_BASE}/page/summary/${encoded}`;

  try {
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });
    if (!res.ok) {
      console.warn(`[wikipedia] summary 404/error for "${title}" (${res.status})`);
      return null;
    }
    const json = await res.json() as Record<string, unknown>;
    return {
      title:       (json.title as string)       ?? title,
      extract:     (json.extract as string)     ?? '',
      description: (json.description as string) ?? undefined,
      thumbnail:   json.thumbnail as WikiSummary['thumbnail'] | undefined,
      content_urls: json.content_urls as WikiSummary['content_urls'] | undefined,
    };
  } catch (err) {
    console.error(`[wikipedia] fetchWikiSummary error for "${title}":`, err);
    return null;
  }
}

// ── Full extract ──────────────────────────────────────────────────────────────

/**
 * Fetch the full plain-text article extract (up to ~10 000 chars) via the
 * MediaWiki Action API.
 *
 * We cap at 10 000 chars to stay within Claude's context limits without
 * consuming excessive tokens.
 */
export async function fetchWikiExtract(
  title: string,
  maxChars = 10_000,
): Promise<WikiExtract | null> {
  const params = new URLSearchParams({
    action:       'query',
    prop:         'extracts|info',
    titles:       title,
    exintro:      '0',        // include full article, not just intro
    explaintext:  '1',        // strip HTML
    exsectionformat: 'plain',
    inprop:       'url',
    format:       'json',
    formatversion: '2',
  });

  const url = `${WIKI_API_BASE}?${params.toString()}`;

  try {
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });
    if (!res.ok) {
      console.warn(`[wikipedia] extract HTTP error for "${title}" (${res.status})`);
      return null;
    }

    const json = await res.json() as {
      query?: {
        pages?: Array<{
          missing?: boolean;
          title: string;
          extract?: string;
          canonicalurl?: string;
        }>;
      };
    };

    const page = json.query?.pages?.[0];
    if (!page || page.missing || !page.extract) {
      console.warn(`[wikipedia] no extract found for "${title}"`);
      return null;
    }

    return {
      title:    page.title,
      fullText: page.extract.slice(0, maxChars),
      pageUrl:  page.canonicalurl ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
    };
  } catch (err) {
    console.error(`[wikipedia] fetchWikiExtract error for "${title}":`, err);
    return null;
  }
}

// ── Search (fallback) ─────────────────────────────────────────────────────────

/**
 * Search Wikipedia for a Nigerian politician by name and return the best
 * matching page title.  Use this when the exact Wikipedia title is unknown.
 */
export async function searchWikiTitle(
  name: string,
): Promise<string | null> {
  const params = new URLSearchParams({
    action:   'query',
    list:     'search',
    srsearch: `${name} Nigerian politician`,
    srlimit:  '3',
    format:   'json',
    formatversion: '2',
  });

  const url = `${WIKI_API_BASE}?${params.toString()}`;

  try {
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });
    if (!res.ok) return null;

    const json = await res.json() as {
      query?: {
        search?: Array<{ title: string }>;
      };
    };

    return json.query?.search?.[0]?.title ?? null;
  } catch {
    return null;
  }
}
