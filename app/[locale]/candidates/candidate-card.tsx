import Link from 'next/link';
import { ShieldCheck, BadgeCheck, Wallet, BarChart3 } from 'lucide-react';
import { getPartyColour, ELECTION_TYPE_LABEL } from '@/lib/party-config';
import { cn } from '@/lib/utils';
import type { CandidateListItem, ElectionType } from '@/types';

interface Props {
  candidate: CandidateListItem;
  locale: string;
}

export function CandidateCard({ candidate: c, locale }: Props) {
  const colour = getPartyColour(c.party_affiliation);

  return (
    <Link
      href={`/${locale}/candidates/${c.id}`}
      className="group flex flex-col rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Party colour stripe */}
      <div className="h-1.5 w-full" style={{ backgroundColor: colour }} />

      <div className="flex flex-1 flex-col p-4 gap-3">
        {/* Avatar + name */}
        <div className="flex items-start gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-white dark:ring-gray-800 shadow-sm"
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
              c.full_name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-bold leading-snug line-clamp-2">{c.full_name}</p>
              {c.is_verified && (
                <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified" />
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ backgroundColor: colour }}
              >
                {c.party_affiliation}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {ELECTION_TYPE_LABEL[c.election_type as ElectionType] ?? c.election_type}
              </span>
            </div>
          </div>
        </div>

        {/* Location */}
        {(c.state || c.constituency) && (
          <p className="text-xs text-muted-foreground">
            {[c.state, c.constituency].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* Current position */}
        {c.current_position && (
          <p className="text-xs text-foreground/70 line-clamp-1">{c.current_position}</p>
        )}

        {/* Stats row */}
        <div className="mt-auto flex items-center gap-3 pt-2 border-t text-xs text-muted-foreground">
          {/* Asset declaration */}
          <span
            className={cn(
              'flex items-center gap-1',
              c.has_assets ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground/60',
            )}
          >
            <Wallet className="h-3.5 w-3.5" />
            {c.has_assets ? 'Assets declared' : 'No declaration'}
          </span>

          {/* Fact-check score */}
          {c.fact_check_score !== null && (
            <span
              className={cn(
                'ml-auto flex items-center gap-1 font-medium',
                c.fact_check_score >= 75
                  ? 'text-green-600 dark:text-green-400'
                  : c.fact_check_score >= 50
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400',
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              {c.fact_check_score}% true
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
