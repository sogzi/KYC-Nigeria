import Link from 'next/link';
import { CheckCircle2, Wallet, BarChart3 } from 'lucide-react';
import { getPartyColour, ELECTION_TYPE_LABEL } from '@/lib/party-config';
import type { CandidateListItem, ElectionType } from '@/types';

interface Props {
  candidate: CandidateListItem;
  locale: string;
}

export function CandidateCard({ candidate: c, locale }: Props) {
  const colour = getPartyColour(c.party_affiliation);
  const initials = c.full_name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  return (
    <Link
      href={`/${locale}/candidates/${c.id}`}
      className="group flex items-start overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      {/* Party colour bar — left edge */}
      <div className="w-1.5 shrink-0 self-stretch rounded-l-xl" style={{ backgroundColor: colour }} />

      {/* Avatar */}
      <div
        className="mx-4 mt-5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[15px] font-black text-white shadow ring-2 ring-white"
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
          initials
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-2 py-4 pr-4 min-w-0">

        {/* Name row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold leading-snug truncate">{c.full_name}</p>
            {c.current_position && (
              <p className="text-xs text-muted-foreground truncate">{c.current_position}</p>
            )}
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: colour }}
          >
            {c.party_affiliation}
          </span>
        </div>

        {/* Chips row */}
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold capitalize text-secondary-foreground">
            {ELECTION_TYPE_LABEL[c.election_type as ElectionType] ?? c.election_type}
          </span>
          {c.state && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
              {c.state}
            </span>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
          <span
            className={
              c.is_verified
                ? 'flex items-center gap-1 font-semibold text-brand-green'
                : 'flex items-center gap-1 text-muted-foreground'
            }
          >
            <CheckCircle2 className="h-3 w-3" />
            {c.is_verified ? 'Verified Profile' : 'Unverified'}
          </span>

          <div className="flex items-center gap-3">
            {/* Assets */}
            <span
              className={
                c.has_assets
                  ? 'flex items-center gap-1 text-muted-foreground'
                  : 'flex items-center gap-1 text-amber-600 font-medium'
              }
            >
              <Wallet className="h-3 w-3" />
              {c.has_assets ? 'Assets Declared' : 'No Declaration'}
            </span>

            {/* Fact-check score */}
            {c.fact_check_score !== null && (
              <span
                className={
                  c.fact_check_score >= 75
                    ? 'flex items-center gap-1 font-semibold text-brand-green'
                    : c.fact_check_score >= 50
                    ? 'flex items-center gap-1 text-amber-600 font-medium'
                    : 'flex items-center gap-1 text-red-600 font-medium'
                }
              >
                <BarChart3 className="h-3 w-3" />
                {c.fact_check_score}% true
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
