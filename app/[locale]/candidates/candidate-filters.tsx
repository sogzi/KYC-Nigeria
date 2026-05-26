'use client';

/**
 * CandidateFilters — URL-param driven filter panel for /candidates.
 *
 * Changes push to the URL so the page re-renders server-side with fresh data.
 * All filter state lives in the URL — no local state → shareable, bookmarkable.
 */

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition, useCallback } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NIGERIAN_STATES, MAJOR_PARTIES } from '@/types';
import { ELECTION_TYPE_LABEL } from '@/lib/party-config';
import { cn } from '@/lib/utils';

const ELECTION_TYPES = [
  { value: 'presidential',   label: ELECTION_TYPE_LABEL.presidential },
  { value: 'gubernatorial',  label: ELECTION_TYPE_LABEL.gubernatorial },
  { value: 'senatorial',     label: ELECTION_TYPE_LABEL.senatorial },
  { value: 'house_of_reps',  label: ELECTION_TYPE_LABEL.house_of_reps },
];

const SCORE_OPTIONS = [
  { value: '50',  label: '≥ 50% true' },
  { value: '75',  label: '≥ 75% true' },
  { value: '100', label: '100% true' },
];

interface Props {
  totalCount: number;
}

export function CandidateFilters({ totalCount }: Props) {
  const router     = useRouter();
  const pathname   = usePathname();
  const params     = useSearchParams();
  const [, startT] = useTransition();

  // Read current filter values from URL
  const q            = params.get('q')            ?? '';
  const electionType = params.get('election_type') ?? '';
  const state        = params.get('state')         ?? '';
  const party        = params.get('party')         ?? '';
  const hasAssets    = params.get('has_assets')    ?? '';
  const minScore     = params.get('min_score')     ?? '';

  const activeCount = [electionType, state, party, hasAssets, minScore].filter(Boolean).length;

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      // Reset to page 1 on filter change
      next.delete('page');
      startT(() => router.push(`${pathname}?${next.toString()}`));
    },
    [params, pathname, router],
  );

  const clearAll = () => {
    const next = new URLSearchParams();
    if (q) next.set('q', q); // keep search query
    startT(() => router.push(`${pathname}?${next.toString()}`));
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{totalCount} result{totalCount !== 1 ? 's' : ''}</span>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 gap-1 text-xs">
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Election type */}
      <FilterGroup label="Election type">
        <div className="flex flex-wrap gap-1.5">
          {ELECTION_TYPES.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={electionType === value}
              onClick={() => update('election_type', electionType === value ? '' : value)}
            >
              {label}
            </FilterChip>
          ))}
        </div>
      </FilterGroup>

      {/* State */}
      <FilterGroup label="State">
        <select
          value={state}
          onChange={(e) => update('state', e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All states</option>
          {[...NIGERIAN_STATES].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </FilterGroup>

      {/* Party */}
      <FilterGroup label="Party">
        <div className="flex flex-wrap gap-1.5">
          {MAJOR_PARTIES.map((p) => (
            <FilterChip
              key={p}
              active={party === p}
              onClick={() => update('party', party === p ? '' : p)}
            >
              {p}
            </FilterChip>
          ))}
        </div>
      </FilterGroup>

      {/* Asset declaration */}
      <FilterGroup label="Asset declared">
        <div className="flex gap-1.5">
          {[
            { value: 'yes', label: 'Yes' },
            { value: 'no',  label: 'No' },
          ].map(({ value, label }) => (
            <FilterChip
              key={value}
              active={hasAssets === value}
              onClick={() => update('has_assets', hasAssets === value ? '' : value)}
            >
              {label}
            </FilterChip>
          ))}
        </div>
      </FilterGroup>

      {/* Fact-check score */}
      <FilterGroup label="Fact-check score">
        <div className="flex flex-wrap gap-1.5">
          {SCORE_OPTIONS.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={minScore === value}
              onClick={() => update('min_score', minScore === value ? '' : value)}
            >
              {label}
            </FilterChip>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

// ── Micro-components ──────────────────────────────────────────────────────────

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background hover:bg-muted text-foreground',
      )}
    >
      {children}
    </button>
  );
}
