import { BadgeCheck, Share2, Flag, GitCompare } from 'lucide-react';
import { ShareButton } from './share-button';
import { ReportModal } from './report-modal';
import { VerificationBadge } from '@/components/admin/verification-badge';
import {
  getPartyColour,
  ELECTION_TYPE_LABEL,
  formatNaira,
} from '@/lib/party-config';
import type { CandidateProfile } from '@/types';

interface Props {
  candidate: CandidateProfile;
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function yearsInService(candidate: CandidateProfile): string {
  if (!candidate.track_records.length) return 'N/A';
  const earliest = Math.min(...candidate.track_records.map((r) => r.year));
  return `${new Date().getFullYear() - earliest}`;
}

function countTerms(candidate: CandidateProfile): string {
  const count = candidate.track_records.filter((r) => r.record_type === 'appointment').length;
  return count > 0 ? `${count}` : 'N/A';
}

function factCheckScore(candidate: CandidateProfile): string {
  const total = candidate.fact_checks.length;
  if (!total) return 'N/A';
  const trueCount = candidate.fact_checks.filter((f) => f.verdict === 'true').length;
  return `${Math.round((trueCount / total) * 100)}%`;
}

export function CandidateHero({ candidate }: Props) {
  const partyColour = getPartyColour(candidate.party_affiliation);
  const electionLabel = ELECTION_TYPE_LABEL[candidate.election_type] ?? candidate.election_type;
  const initials = getInitials(candidate.full_name);

  const quickStats = [
    { value: yearsInService(candidate),      label: 'YRS PUBLIC SERVICE' },
    { value: countTerms(candidate),           label: 'TERMS AS GOVERNOR' },
    {
      value: candidate.asset_declarations.length > 0
        ? formatNaira(candidate.asset_declarations[0].total_assets_naira)
        : 'None',
      label: 'DECLARED ASSETS',
    },
    { value: factCheckScore(candidate),       label: 'CLAIMS VERIFIED TRUE' },
  ];

  return (
    <div>
      {/* ── Top: avatar + info + actions ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

        {/* Large avatar */}
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-black text-white shadow-lg ring-4 ring-offset-2"
          style={{ backgroundColor: partyColour, '--tw-ring-color': partyColour } as React.CSSProperties}
        >
          {candidate.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={candidate.photo_url}
              alt={candidate.full_name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        {/* Name block */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-black leading-tight sm:text-4xl">
              {candidate.full_name}
            </h1>
            {candidate.is_verified && (
              <BadgeCheck
                className="h-6 w-6 shrink-0"
                style={{ color: partyColour }}
                aria-label="Verified profile"
              />
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{electionLabel} Candidate</span>
            <span className="text-border">·</span>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
              style={{ backgroundColor: partyColour }}
            >
              {candidate.party_affiliation}
            </span>
            {candidate.current_position && (
              <>
                <span className="text-border">|</span>
                <span>{candidate.current_position}</span>
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <div className="flex gap-2">
            <ShareButton />
            <ReportModal
              candidateName={candidate.full_name}
              candidateId={candidate.id}
            />
          </div>
        </div>
      </div>

      {/* ── Quick stats bar ── */}
      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4">
        {quickStats.map(({ value, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-0.5 bg-card px-3 py-4 text-center"
          >
            <span className="text-xl font-black text-brand-green">{value}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Verification badge ── */}
      {candidate.last_verified_at && (
        <div className="mt-4">
          <VerificationBadge
            verifiedAt={candidate.last_verified_at}
            verifiedBy={candidate.last_verified_by}
          />
        </div>
      )}
    </div>
  );
}
