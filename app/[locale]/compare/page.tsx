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
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ids?: string }>;
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
  const { locale: rawLocale } = await params;
  const locale = locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : 'en';
  setRequestLocale(locale);

  const { ids } = await searchParams;
  const selectedIds = parseIds(ids);

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
    <div className="bg-brand-bg min-h-screen">
      {/* ── Page header ── */}
      <div className="border-b bg-white px-4 py-8">
        <div className="container mx-auto max-w-6xl flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Compare <span className="text-brand-green">Candidates</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              See where candidates stand on the issues that matter most — side by side, issue by issue.
            </p>
          </div>
          {selectedIds.length >= 2 && (
            <ShareComparisonButton candidateIds={selectedIds} />
          )}
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
      {/* ── Candidate selector ── */}
      <section className="rounded-xl border bg-white p-4 sm:p-5 shadow-sm">
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
      <footer className="flex items-start gap-2 rounded-lg border bg-white px-4 py-3 text-xs text-muted-foreground shadow-sm">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-green" />
        <p>
          <strong>Disclaimer:</strong> Policy strength scores are based on specificity, feasibility and
          verifiability of stated positions — not political alignment. Grades are editorial assessments by
          NaijaVote researchers and do not constitute an endorsement of any candidate. All data sourced
          from public records, INEC filings and verified media. Last updated:{' '}
          <strong>{lastUpdated}</strong>.{' '}
          <a href="/en/about" className="underline underline-offset-2 hover:text-brand-green">
            Learn more about our methodology.
          </a>
        </p>
      </footer>
      </div>
    </div>
  );
}
