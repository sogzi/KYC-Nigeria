import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { Newspaper, RefreshCw, Clock } from 'lucide-react';
import { locales, type Locale } from '@/i18n/config';
import { getNewsArticles, getNewsStats } from '@/lib/news/queries';
import { SAMPLE_ARTICLES }               from '@/lib/news/sample-data';
import { NewsCard }    from './news-card';
import { NewsFilters } from './news-filters';
import { Skeleton }    from '@/components/ui/skeleton';
import type { NewsArticle } from '@/types';

export const metadata: Metadata = {
  title: 'Election News | NaijaVote',
  description: 'Latest Nigerian election news, enriched with AI summaries and policy tags.',
};

export const dynamic = 'force-dynamic';

type Props = {
  params:       Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function sp(val: string | string[] | undefined): string {
  return Array.isArray(val) ? (val[0] ?? '') : (val ?? '');
}

function formatTimestamp(ts: string | null): string {
  if (!ts) return 'Never';
  try {
    return new Date(ts).toLocaleString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

export default async function NewsPage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params;
  const locale = locales.includes(rawLocale as Locale) ? (rawLocale as Locale) : 'en';
  setRequestLocale(locale);

  const sp_vals   = await searchParams;
  const activeTag = sp(sp_vals.tag);
  const activeSentiment = sp(sp_vals.sentiment);

  // Fetch from DB
  const [dbArticles, stats] = await Promise.all([
    getNewsArticles({
      policy_tag: activeTag       || undefined,
      sentiment:  activeSentiment || undefined,
      limit: 30,
    }),
    getNewsStats(),
  ]);

  // Fall back to sample data when DB is empty
  const usingSampleData = dbArticles.length === 0;
  let articles: NewsArticle[];

  if (usingSampleData) {
    // Filter sample data client-side
    let filtered = SAMPLE_ARTICLES as NewsArticle[];
    if (activeTag) {
      filtered = filtered.filter((a) => a.policy_tags?.includes(activeTag));
    }
    if (activeSentiment) {
      filtered = filtered.filter((a) => a.sentiment === activeSentiment);
    }
    articles = filtered;
  } else {
    articles = dbArticles;
  }

  return (
    <div className="bg-brand-bg min-h-screen">

      {/* ── Page header ── */}
      <div className="border-b bg-white px-4 py-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Election{' '}
                <span className="text-brand-green">News</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Latest Nigerian election coverage, AI-summarised and tagged by topic.
              </p>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              {usingSampleData ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-amber-700 font-semibold">
                  <Newspaper className="h-3 w-3" />
                  Demo data — connect NewsAPI for live articles
                </span>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1">
                    <Newspaper className="h-3.5 w-3.5" />
                    {stats.total} articles
                  </span>
                  {stats.lastFetched && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Updated {formatTimestamp(stats.lastFetched)}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6">

        {/* ── Filters ── */}
        <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm">
          <Suspense fallback={
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-20 rounded-full" />
              ))}
            </div>
          }>
            <NewsFilters
              currentTag={activeTag}
              currentSentiment={activeSentiment}
            />
          </Suspense>
        </div>

        {/* ── Results count ── */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {articles.length === 0
              ? 'No articles match your filters'
              : `${articles.length} article${articles.length === 1 ? '' : 's'}`}
            {activeTag && (
              <span className="ml-1">
                in <strong className="text-brand-green capitalize">{activeTag}</strong>
              </span>
            )}
            {activeSentiment && (
              <span className="ml-1">
                · tone: <strong className="text-brand-green capitalize">{activeSentiment}</strong>
              </span>
            )}
          </p>

          {!usingSampleData && (
            <a
              href={`/${locale}/news`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-brand-green transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Reset filters
            </a>
          )}
        </div>

        {/* ── Article grid ── */}
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
            <Newspaper className="h-12 w-12 text-muted-foreground/30" strokeWidth={1.25} />
            <p className="mt-4 font-semibold">No articles match your filters</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different topic or tone filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {/* ── How it works note ── */}
        {usingSampleData && (
          <div className="mt-8 rounded-xl border border-dashed bg-white p-6 text-center text-sm text-muted-foreground">
            <Newspaper className="mx-auto mb-2 h-8 w-8 text-brand-green/40" strokeWidth={1.25} />
            <p className="font-semibold text-gray-700 mb-1">Live news coming soon</p>
            <p>
              These are sample articles showing what the News tab will look like.
              When <code className="rounded bg-secondary px-1 py-0.5 text-xs font-mono">NEWSAPI_KEY</code> is
              configured, this page will display real-time Nigerian election coverage — automatically
              summarised and tagged by Claude AI.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
