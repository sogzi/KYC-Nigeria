'use client';

/**
 * ComparisonGrid — the core display component.
 *
 * Layout strategy:
 * ─────────────────────────────────────────────────────────
 * Mobile (< md):
 *   • Horizontally scrollable with CSS scroll-snap
 *   • First column (labels) is sticky on the left
 *   • scroll-padding-left matches the label column width so snap
 *     points land correctly after the sticky label column
 *   • Each candidate column fills the remaining viewport width
 *     → exactly one candidate is visible per "page" of scroll
 *
 * Desktop (≥ md):
 *   • All candidate columns visible at once (auto width)
 *   • Header row sticky at the top (below the navbar)
 *   • Label column still sticky-left for wide tables
 * ─────────────────────────────────────────────────────────
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, GraduationCap, Landmark, BookOpen, ListChecks, PiggyBank, CheckSquare, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPartyColour, ELECTION_TYPE_LABEL } from '@/lib/party-config';
import type { CandidateProfile } from '@/types';
import type { ComparisonSection, ComparisonCell } from './comparison-data';

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap, Landmark, BookOpen, ListChecks, PiggyBank, CheckSquare,
};

// ── Colour coding ─────────────────────────────────────────────────────────────

/** Row highlight when values differ across candidates */
const ROW_DIFF_CLASS = 'bg-amber-50 dark:bg-amber-900/10';

/** Cell-level highlight for "best" numeric value in the row */
function bestCellIndex(cells: ComparisonCell[], prefer: 'highest' | 'lowest'): number | null {
  const nums = cells.map((c) => (c.isEmpty ? null : c.raw));
  const defined = nums.filter((n): n is number => n !== null && n !== undefined);
  if (defined.length < 2) return null;
  const target = prefer === 'highest' ? Math.max(...defined) : Math.min(...defined);
  return nums.findIndex((n) => n === target);
}

// Row IDs that have a "best" direction
const BEST_HIGHEST = new Set(['svc-years', 'svc-appointments', 'tr-achievements', 'fc-true', 'tr-ratio']);
const BEST_LOWEST  = new Set(['tr-controversies']);

// ── Sub-components ────────────────────────────────────────────────────────────

function CandidateHeader({ candidate }: { candidate: CandidateProfile }) {
  const colour = getPartyColour(candidate.party_affiliation);
  return (
    <div className="flex flex-col items-center gap-1 px-3 py-4 text-center">
      {/* Avatar */}
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-white dark:ring-gray-800"
        style={{ backgroundColor: colour }}
      >
        {candidate.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={candidate.photo_url}
            alt={candidate.full_name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          candidate.full_name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
        )}
      </div>
      <p className="mt-1 font-bold leading-tight text-sm line-clamp-2">{candidate.full_name}</p>
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
        style={{ backgroundColor: colour }}
      >
        {candidate.party_affiliation}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {ELECTION_TYPE_LABEL[candidate.election_type] ?? candidate.election_type}
        {candidate.state ? ` · ${candidate.state}` : ''}
      </span>
    </div>
  );
}

function CellDisplay({
  cell,
  isBest,
}: {
  cell: ComparisonCell;
  isBest?: boolean;
}) {
  return (
    <div
      className={cn(
        'px-3 py-3 text-sm',
        cell.isEmpty && 'text-muted-foreground/60 italic',
        isBest && 'font-semibold text-green-700 dark:text-green-400',
      )}
    >
      <span>{cell.isEmpty ? '—' : cell.content}</span>
      {cell.sub && !cell.isEmpty && (
        <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{cell.sub}</p>
      )}
    </div>
  );
}

function SectionHeaderRow({
  section,
  numCandidates,
}: {
  section: ComparisonSection;
  numCandidates: number;
}) {
  const Icon = SECTION_ICONS[section.icon] ?? BookOpen;
  return (
    <div className="flex border-t-2 border-border bg-[#006400]">
      {/* Label column */}
      <div className="sticky left-0 z-10 flex w-40 shrink-0 items-center gap-2 bg-[#006400] px-3 py-2.5">
        <Icon className="h-4 w-4 shrink-0 text-white/70" />
        <span className="text-xs font-bold uppercase tracking-wider text-white">
          {section.title}
        </span>
      </div>
      {/* Spacer cells */}
      {Array.from({ length: numCandidates }).map((_, i) => (
        <div
          key={i}
          className="min-w-[calc(100vw-10rem)] border-l border-white/10 bg-[#006400]/90 md:min-w-0 md:flex-1"
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  candidates: CandidateProfile[];
  sections: ComparisonSection[];
}

export function ComparisonGrid({ candidates, sections }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Track active candidate on scroll (mobile only)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      // Each candidate col = (scrollWidth - labelWidth) / numCandidates
      // labelWidth = 160px (w-40 = 10rem)
      const labelWidth = 160;
      const candidateAreaWidth = el.scrollWidth - labelWidth;
      const colWidth = candidateAreaWidth / candidates.length;
      const idx = Math.round(el.scrollLeft / colWidth);
      setActiveIdx(Math.min(candidates.length - 1, Math.max(0, idx)));
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [candidates.length]);

  const scrollToCandidate = (idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const labelWidth = 160;
    const candidateAreaWidth = el.scrollWidth - labelWidth;
    const colWidth = candidateAreaWidth / candidates.length;
    el.scrollTo({ left: colWidth * idx, behavior: 'smooth' });
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Scrollable container */}
      <div
        ref={scrollRef}
        // scroll-padding-left matches the w-40 label column so snap points land
        // correctly after the sticky label column on mobile.
        className={cn(
          'overflow-x-auto [-webkit-overflow-scrolling:touch]',
          '[scroll-snap-type:x_mandatory] [scroll-padding-left:10rem]',
        )}
      >
        {/* ── Sticky header row ── */}
        <div
          className="flex sticky top-0 z-20 border-b bg-card shadow-sm"
          style={{ top: '64px' }} // clear the app navbar
        >
          {/* Corner cell */}
          <div className="sticky left-0 z-30 w-40 shrink-0 bg-card border-r" />
          {/* Candidate headers */}
          {candidates.map((c) => (
            <div
              key={c.id}
              className={cn(
                'min-w-[calc(100vw-10rem)] border-l md:min-w-0 md:flex-1',
                '[scroll-snap-align:start]',
              )}
            >
              <CandidateHeader candidate={c} />
            </div>
          ))}
        </div>

        {/* ── Sections ── */}
        {sections.map((section) => (
          <div key={section.id}>
            <SectionHeaderRow section={section} numCandidates={candidates.length} />

            {section.rows.map((row) => {
              const bestDir = BEST_HIGHEST.has(row.id)
                ? 'highest'
                : BEST_LOWEST.has(row.id)
                ? 'lowest'
                : null;
              const bestIdx = bestDir ? bestCellIndex(row.cells, bestDir) : null;

              return (
                <div
                  key={row.id}
                  className={cn(
                    'flex border-b border-border/50',
                    row.isDifferent && ROW_DIFF_CLASS,
                  )}
                >
                  {/* Label cell — sticky left */}
                  <div
                    className={cn(
                      'sticky left-0 z-10 flex w-40 shrink-0 items-start border-r px-3 py-3',
                      row.isDifferent
                        ? 'bg-amber-50 dark:bg-amber-900/10'
                        : 'bg-card',
                    )}
                  >
                    <span className="text-xs text-muted-foreground leading-snug">
                      {row.label}
                    </span>
                    {row.isDifferent && (
                      <span className="ml-auto mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    )}
                  </div>

                  {/* Data cells */}
                  {row.cells.map((cell, i) => (
                    <div
                      key={i}
                      className={cn(
                        'min-w-[calc(100vw-10rem)] border-l md:min-w-0 md:flex-1',
                        '[scroll-snap-align:start]',
                      )}
                    >
                      <CellDisplay cell={cell} isBest={bestIdx === i} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Mobile swipe controls (hidden on desktop) ── */}
      <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 md:hidden">
        <button
          onClick={() => scrollToCandidate(Math.max(0, activeIdx - 1))}
          disabled={activeIdx === 0}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium disabled:opacity-30 hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {candidates.map((c, i) => (
            <button
              key={c.id}
              onClick={() => scrollToCandidate(i)}
              aria-label={c.full_name}
              className={cn(
                'rounded-full transition-all',
                i === activeIdx
                  ? 'h-2.5 w-6 bg-primary'
                  : 'h-2 w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60',
              )}
            />
          ))}
        </div>

        <button
          onClick={() => scrollToCandidate(Math.min(candidates.length - 1, activeIdx + 1))}
          disabled={activeIdx === candidates.length - 1}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium disabled:opacity-30 hover:bg-accent transition-colors"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* ── Colour legend ── */}
      <div className="flex flex-wrap items-center gap-4 border-t bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
          Candidates differ on this row
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
          Best value in row
        </span>
      </div>
    </div>
  );
}
