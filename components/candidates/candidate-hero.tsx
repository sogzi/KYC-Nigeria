import { BadgeCheck, MapPin, Briefcase, Landmark, FileText } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ShareButton } from './share-button';
import { ReportModal } from './report-modal';
import {
  getPartyColour,
  ELECTION_TYPE_BADGE,
  ELECTION_TYPE_LABEL,
  formatNaira,
} from '@/lib/party-config';
import type { CandidateProfile } from '@/types';

interface Props {
  candidate: CandidateProfile;
}

/** Derive initials from full name for avatar fallback. */
function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

/** Calculate approximate years in public service from earliest track record. */
function yearsInService(candidate: CandidateProfile): string {
  if (!candidate.track_records.length) return 'N/A';
  const earliest = Math.min(...candidate.track_records.map((r) => r.year));
  return `${new Date().getFullYear() - earliest}`;
}

/** Count terms (appointments in track record). */
function countTerms(candidate: CandidateProfile): string {
  const count = candidate.track_records.filter(
    (r) => r.record_type === 'appointment',
  ).length;
  return count > 0 ? `${count}` : 'N/A';
}

const QUICK_STATS = (candidate: CandidateProfile) => [
  {
    icon: Briefcase,
    label: 'Yrs in service',
    value: yearsInService(candidate),
  },
  {
    icon: Landmark,
    label: 'Terms / Appointments',
    value: countTerms(candidate),
  },
  {
    icon: FileText,
    label: 'Assets declared',
    value:
      candidate.asset_declarations.length > 0
        ? formatNaira(candidate.asset_declarations[0].total_assets_naira)
        : 'None on file',
  },
];

export function CandidateHero({ candidate }: Props) {
  const partyColour = getPartyColour(candidate.party_affiliation);
  const electionBadge =
    ELECTION_TYPE_BADGE[candidate.election_type] ??
    'bg-gray-100 text-gray-800 border border-gray-200';
  const electionLabel =
    ELECTION_TYPE_LABEL[candidate.election_type] ?? candidate.election_type;

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Coloured party banner */}
      <div className="h-3 w-full" style={{ backgroundColor: partyColour }} />

      <div className="p-5 sm:p-6">
        {/* Top row: photo + name block + actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* Photo */}
          <Avatar
            className="h-24 w-24 shrink-0 ring-4 ring-offset-2"
            style={{ '--tw-ring-color': partyColour } as React.CSSProperties}
          >
            {candidate.photo_url && (
              <AvatarImage
                src={candidate.photo_url}
                alt={candidate.full_name}
              />
            )}
            <AvatarFallback
              className="text-2xl"
              style={{ backgroundColor: partyColour + '20', color: partyColour }}
            >
              {getInitials(candidate.full_name)}
            </AvatarFallback>
          </Avatar>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
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

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* Party pill */}
              <span
                className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold text-white"
                style={{ backgroundColor: partyColour }}
              >
                {candidate.party_affiliation}
              </span>
              {/* Election type badge */}
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${electionBadge}`}>
                {electionLabel}
              </span>
            </div>

            {/* Position + location */}
            <div className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4">
              {candidate.current_position && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" />
                  {candidate.current_position}
                </span>
              )}
              {candidate.state_of_origin && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {candidate.state_of_origin}
                  {candidate.local_government ? `, ${candidate.local_government}` : ''}
                </span>
              )}
              {candidate.state && candidate.election_type !== 'presidential' && (
                <span className="flex items-center gap-1.5">
                  <Landmark className="h-3.5 w-3.5 shrink-0" />
                  {candidate.state}
                  {candidate.constituency ? ` · ${candidate.constituency}` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 items-start gap-2">
            <ShareButton />
            <ReportModal
              candidateName={candidate.full_name}
              candidateId={candidate.id}
            />
          </div>
        </div>

        {/* Quick stats bar */}
        <div className="mt-5 grid grid-cols-3 divide-x rounded-lg border bg-muted/40">
          {QUICK_STATS(candidate).map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-0.5 px-2 py-3 text-center"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-base font-bold">{value}</span>
              <span className="text-xs text-muted-foreground leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
