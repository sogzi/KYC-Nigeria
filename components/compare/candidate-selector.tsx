'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X, ChevronDown, Plus, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPartyColour, ELECTION_TYPE_LABEL } from '@/lib/party-config';
import { NIGERIAN_STATES } from '@/types';
import type { CandidateCard, ElectionType } from '@/types';

const ELECTION_TYPE_OPTIONS: { value: ElectionType | ''; label: string }[] = [
  { value: '',              label: 'All election types' },
  { value: 'presidential',  label: 'Presidential'       },
  { value: 'gubernatorial', label: 'Gubernatorial'      },
  { value: 'senatorial',    label: 'Senatorial'         },
  { value: 'house_of_reps', label: 'House of Reps'      },
];

interface Props {
  allCandidates: CandidateCard[];
  selectedIds: string[];
}

/** Initials fallback for candidates without a photo. */
function initials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

export function CandidateSelector({ allCandidates, selectedIds }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<ElectionType | ''>('');
  const [filterState, setFilterState] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (dropdownOpen) searchRef.current?.focus();
  }, [dropdownOpen]);

  /** Push new set of IDs into the URL. */
  const updateUrl = (newIds: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newIds.length) {
      params.set('ids', newIds.join(','));
    } else {
      params.delete('ids');
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const addCandidate = (id: string) => {
    if (selectedIds.length >= 3 || selectedIds.includes(id)) return;
    updateUrl([...selectedIds, id]);
    setDropdownOpen(false);
    setSearch('');
  };

  const removeCandidate = (id: string) => {
    updateUrl(selectedIds.filter((s) => s !== id));
  };

  /** Candidates available to pick (not already selected). */
  const availableCandidates = allCandidates.filter(
    (c) =>
      !selectedIds.includes(c.id) &&
      (filterType === '' || c.election_type === filterType) &&
      (filterState === '' || c.state === filterState) &&
      (search === '' ||
        c.full_name.toLowerCase().includes(search.toLowerCase()) ||
        c.party_affiliation.toLowerCase().includes(search.toLowerCase())),
  );

  const selectedCandidates = selectedIds
    .map((id) => allCandidates.find((c) => c.id === id))
    .filter((c): c is CandidateCard => !!c);

  const canAddMore = selectedIds.length < 3;

  // Unique states for the state filter dropdown
  const uniqueStates = Array.from(
    new Set(
      allCandidates
        .map((c) => c.state)
        .filter((s): s is string => !!s),
    ),
  ).sort();

  return (
    <div className="space-y-4">
      {/* ── Filter bar ── */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ElectionType | '')}
          className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {ELECTION_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All states</option>
          {uniqueStates.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* ── Selected candidate chips + Add button ── */}
      <div className="flex flex-wrap items-start gap-3">
        {selectedCandidates.map((c) => {
          const colour = getPartyColour(c.party_affiliation);
          return (
            <div
              key={c.id}
              className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm"
            >
              {/* Avatar */}
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: colour }}
              >
                {c.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.photo_url}
                    alt={c.full_name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  initials(c.full_name)
                )}
              </div>

              {/* Name + meta */}
              <div className="max-w-[140px]">
                <p className="truncate text-sm font-semibold leading-tight">
                  {c.full_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.party_affiliation}
                  {c.state ? ` · ${c.state}` : ''}
                </p>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeCandidate(c.id)}
                className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label={`Remove ${c.full_name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}

        {/* Add candidate dropdown trigger */}
        {canAddMore && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className={cn(
                'flex items-center gap-2 rounded-lg border border-dashed px-4 py-2.5 text-sm font-medium',
                'text-muted-foreground hover:border-primary hover:text-primary transition-colors',
              )}
            >
              <Plus className="h-4 w-4" />
              Add candidate
              <span className="text-xs text-muted-foreground">
                ({3 - selectedIds.length} left)
              </span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform',
                  dropdownOpen && 'rotate-180',
                )}
              />
            </button>

            {/* ── Dropdown panel ── */}
            {dropdownOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 w-80 overflow-hidden rounded-lg border bg-popover shadow-lg">
                {/* Search */}
                <div className="flex items-center gap-2 border-b px-3 py-2">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or party…"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                  {search && (
                    <button onClick={() => setSearch('')}>
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>

                {/* Candidate list */}
                <ul className="max-h-60 overflow-y-auto py-1">
                  {availableCandidates.length === 0 ? (
                    <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                      <UserRound className="mx-auto mb-1 h-6 w-6 opacity-30" />
                      No candidates match your filters
                    </li>
                  ) : (
                    availableCandidates.map((c) => {
                      const colour = getPartyColour(c.party_affiliation);
                      return (
                        <li key={c.id}>
                          <button
                            onClick={() => addCandidate(c.id)}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors"
                          >
                            {/* Avatar dot */}
                            <div
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                              style={{ backgroundColor: colour }}
                            >
                              {initials(c.full_name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {c.full_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {c.party_affiliation}
                                {' · '}
                                {ELECTION_TYPE_LABEL[c.election_type] ?? c.election_type}
                                {c.state ? ` · ${c.state}` : ''}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {selectedIds.length === 3 && (
          <p className="self-center text-xs text-muted-foreground">
            Maximum 3 candidates selected.
          </p>
        )}
      </div>
    </div>
  );
}
