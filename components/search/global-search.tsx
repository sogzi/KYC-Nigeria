'use client';

/**
 * GlobalSearch — Cmd/Ctrl+K command palette.
 *
 * Results are fetched from GET /api/search?q= with 300 ms debounce.
 * Groups: Candidates | Manifesto Points | Speeches.
 * Clicking a result navigates to the relevant page and closes the dialog.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Search, X, User2, BookOpen, Mic2, Loader2, ArrowRight,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ELECTION_TYPE_LABEL } from '@/lib/party-config';
import type { GlobalSearchResults } from '@/lib/supabase/queries';
import type { ElectionType } from '@/types';

// ── Hook: debounced search fetch ──────────────────────────────────────────────

function useSearch(query: string, delay = 300) {
  const [results, setResults] = useState<GlobalSearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json() as GlobalSearchResults;
        setResults(data);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      setLoading(false);
    };
  }, [query, delay]);

  return { results, loading };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ResultSection({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground">{count}</span>
      </div>
      {children}
    </div>
  );
}

function ResultItem({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      {children}
      <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, loading } = useSearch(query);
  const router = useRouter();
  const locale = useLocale();

  const totalResults = results
    ? results.candidates.length + results.manifestos.length + results.speeches.length
    : 0;

  // Cmd/Ctrl+K shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [open]);

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      router.push(`/${locale}${path}`);
    },
    [locale, router],
  );

  const hasResults = results && totalResults > 0;
  const isEmpty    = results && totalResults === 0 && query.trim().length >= 2;

  return (
    <>
      {/* ── Search trigger button ── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open search"
        className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline">Search…</span>
        <kbd className="hidden lg:inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      {/* ── Dialog palette ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="gap-0 p-0 sm:max-w-xl overflow-hidden"
          // Override default DialogContent padding & close button position
        >
          {/* Search input */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            {loading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search candidates, manifestos, speeches…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto px-2 py-2">
            {!query || query.trim().length < 2 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Start typing to search…
              </p>
            ) : isEmpty ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No results for <strong>&ldquo;{query}&rdquo;</strong>
              </p>
            ) : hasResults ? (
              <div className="space-y-1">
                {/* ── Candidates ── */}
                <ResultSection
                  icon={User2}
                  title="Candidates"
                  count={results.candidates.length}
                >
                  {results.candidates.map((c) => (
                    <ResultItem
                      key={c.id}
                      onClick={() => navigate(`/candidates/${c.id}`)}
                    >
                      {c.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.photo_url}
                          alt={c.full_name}
                          className="h-8 w-8 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {c.full_name.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{c.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.party_affiliation}
                          {' · '}
                          {ELECTION_TYPE_LABEL[c.election_type as ElectionType] ?? c.election_type}
                          {c.state ? ` · ${c.state}` : ''}
                        </p>
                      </div>
                    </ResultItem>
                  ))}
                </ResultSection>

                {/* Separator */}
                {results.candidates.length > 0 && results.manifestos.length > 0 && (
                  <div className="mx-3 my-1 border-t" />
                )}

                {/* ── Manifesto Points ── */}
                <ResultSection
                  icon={BookOpen}
                  title="Manifesto Points"
                  count={results.manifestos.length}
                >
                  {results.manifestos.map((m) => (
                    <ResultItem
                      key={m.id}
                      onClick={() => navigate(`/candidates/${m.candidate_id}?tab=manifesto`)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{m.section_title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {m.candidate_name} · {m.content.slice(0, 60)}…
                        </p>
                      </div>
                    </ResultItem>
                  ))}
                </ResultSection>

                {/* Separator */}
                {results.manifestos.length > 0 && results.speeches.length > 0 && (
                  <div className="mx-3 my-1 border-t" />
                )}

                {/* ── Speeches ── */}
                <ResultSection
                  icon={Mic2}
                  title="Speeches"
                  count={results.speeches.length}
                >
                  {results.speeches.map((s) => (
                    <ResultItem
                      key={s.id}
                      onClick={() => navigate(`/candidates/${s.candidate_id}?tab=speeches`)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{s.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {s.candidate_name}
                          {' · '}
                          {new Date(s.date).toLocaleDateString('en-NG', {
                            month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>
                    </ResultItem>
                  ))}
                </ResultSection>
              </div>
            ) : null}
          </div>

          {/* Footer hint */}
          <div className="border-t px-4 py-2 text-[11px] text-muted-foreground">
            Press <kbd className="rounded border bg-muted px-1 font-mono">↵</kbd> to select ·{' '}
            <kbd className="rounded border bg-muted px-1 font-mono">Esc</kbd> to close
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
