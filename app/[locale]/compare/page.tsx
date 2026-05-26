import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Info } from 'lucide-react';
import { locales, type Locale } from '@/i18n/config';
import { getAllCandidatesLight, getCandidatesForComparison } from '@/lib/supabase/queries';
import { buildComparisonSections } from '@/components/compare/comparison-data';
import { CandidateSelector } from '@/components/compare/candidate-selector';
import { ComparisonGrid } from '@/components/compare/comparison-grid';
import { ShareComparisonButton } from '@/components/compare/share-comparison-button';
import { EmptyState } from '@/components/compare/empty-state';

export const metadata: Metadata = {
  title: 'Compare Candidates',
  description: 'Side-by-side comparison of Nigerian election candidates — education, manifesto, track record, assets and fact-check verdicts.',
};

// This page uses searchParams → always dynamic
export const dynamic = 'force-dynamic';

type Props = {
  params: { locale: string };
  searchParams: { ids?: string };
};

/** Parse and validate the ?ids= query param (up to 3 UUIDs). */
function parseIds(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^[0-9a-f-]{36}$/i.test(s)) // basic UUID format check
    .slice(0, 3);
}

export default async function ComparePage({ params, searchParams }: Props) {
  const locale = locales.includes(params.locale as Locale)
    ? (params.locale as Locale)
    : 'en';
  setRequestLocale(locale);

  const selectedIds = parseIds(searchParams.ids);

  // Parallel fetch: all candidate names for the selector + full profiles for comparison
  const [allCandidates, selectedProfiles] = await Promise.all([
    getAllCandidatesLight(),
    selectedIds.length ? getCandidatesForComparison(selectedIds) : Promise.resolve([]),
  ]);

  const sections =
    selectedProfiles.length >= 2 ? buildComparisonSections(selectedProfiles) : [];

  const lastUpdated = new Date().toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-10 space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Compare Candidates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select up to 3 candidates for a side-by-side comparison.
          </p>
        </div>

        {/* Share button — only shown once ≥ 2 candidates selected */}
        {selectedIds.length >= 2 && (
          <ShareComparisonButton candidateIds={selectedIds} />
        )}
      </div>

      {/* ── Candidate selector ── */}
      <section className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
        <CandidateSelector
          allCandidates={allCandidates}
          selectedIds={selectedIds}
        />
      </section>

      {/* ── Comparison grid or empty state ── */}
      {selectedProfiles.length >= 2 ? (
        <ComparisonGrid candidates={selectedProfiles} sections={sections} />
      ) : (
        <EmptyState count={selectedProfiles.length} />
      )}

      {/* ── Disclaimer ── */}
      <footer className="flex items-start gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          <strong>Data sourced from public records</strong> including INEC filings,
          official government websites, and verified news sources. Last updated:{' '}
          <strong>{lastUpdated}</strong>. KYC Nigeria does not guarantee completeness
          of data — candidates are responsible for submitting their own information.{' '}
          <a
            href="/en/about"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Learn more about our methodology.
          </a>
        </p>
      </footer>
    </div>
  );
}
