import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { Users } from 'lucide-react';
import { locales, type Locale } from '@/i18n/config';
import { getFilteredCandidates } from '@/lib/supabase/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { CandidateFilters } from './candidate-filters';
import { CandidateCard }    from './candidate-card';
import type { CandidateFilters as Filters } from '@/types';

export const metadata: Metadata = {
  title: 'Candidates | KYC Nigeria',
  description: 'Browse and filter Nigerian election candidates — education, track record, manifesto, and fact-check verdicts.',
};

// URL searchParams drive filtering → always dynamic
export const dynamic = 'force-dynamic';

type Props = {
  params:       { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
};

/** Pull a single string value from searchParams safely. */
function sp(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

export default async function CandidatesPage({ params, searchParams }: Props) {
  const locale = locales.includes(params.locale as Locale)
    ? (params.locale as Locale)
    : 'en';
  setRequestLocale(locale);

  // Build filter object from URL params
  const filters: Filters = {
    q:             sp(searchParams.q),
    election_type: sp(searchParams.election_type),
    state:         sp(searchParams.state),
    party:         sp(searchParams.party),
    has_assets:    sp(searchParams.has_assets) as Filters['has_assets'],
    min_score:     sp(searchParams.min_score),
  };

  const candidates = await getFilteredCandidates(filters);

  return (
    <div className="bg-brand-bg min-h-screen">
      {/* ── Page header ── */}
      <div className="border-b bg-white px-4 py-8">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            Browse <span className="text-brand-green">Candidates</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse all registered candidates. Use the filters to narrow your search.
          </p>
          <div className="mt-4">
            <CandidateSearchInput defaultValue={filters.q ?? ''} />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* ── Sidebar filters ── */}
          <aside className="w-full lg:w-64 xl:w-72 shrink-0">
            <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
              <CandidateFilters totalCount={candidates.length} />
            </Suspense>
          </aside>

          {/* ── Candidate list ── */}
          <section className="flex-1 min-w-0">
            {candidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30" strokeWidth={1.25} />
                <p className="mt-4 font-semibold">No candidates match your filters</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting or clearing the filters.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {candidates.map((c) => (
                  <CandidateCard key={c.id} candidate={c} locale={locale} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// ── Inline search input ───────────────────────────────────────────────────────
// Client component — must be separate to use useRouter without "use client" on page.

import { CandidateSearchInput } from './candidate-search-input';
