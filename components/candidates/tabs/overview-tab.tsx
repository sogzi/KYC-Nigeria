import { GraduationCap, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CandidateProfile, EducationEntry } from '@/types';

interface Props {
  candidate: CandidateProfile;
}

function EducationTimeline({ entries }: { entries: EducationEntry[] }) {
  if (!entries.length) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No education history recorded.
      </p>
    );
  }

  const sorted = [...entries].sort(
    (a, b) => (b.year_end ?? b.year_start ?? 0) - (a.year_end ?? a.year_start ?? 0),
  );

  return (
    <ol className="relative border-l border-border ml-3 space-y-6">
      {sorted.map((entry, i) => (
        <li key={i} className="ml-6">
          {/* Dot */}
          <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-background">
            <GraduationCap className="h-2.5 w-2.5 text-primary" />
          </span>

          <div>
            <p className="font-semibold leading-snug">{entry.institution}</p>
            <p className="text-sm text-muted-foreground">
              {entry.degree}
              {entry.field ? ` — ${entry.field}` : ''}
            </p>
            {(entry.year_start || entry.year_end) && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                {entry.year_start ?? '?'}
                {entry.year_end && entry.year_end !== entry.year_start
                  ? ` – ${entry.year_end}`
                  : ''}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function OverviewTab({ candidate }: Props) {
  return (
    <div className="space-y-6">
      {/* Biography */}
      <Card>
        <CardHeader>
          <CardTitle>Biography</CardTitle>
        </CardHeader>
        <CardContent>
          {candidate.biography ? (
            <div className="prose prose-sm dark:prose-invert max-w-none space-y-3">
              {candidate.biography.split('\n\n').map((para, i) => (
                <p key={i} className="text-sm leading-relaxed text-foreground">
                  {para}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              No biography available yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Education timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Education
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EducationTimeline entries={candidate.education ?? []} />
        </CardContent>
      </Card>

      {/* Date of birth + state of origin summary */}
      {(candidate.date_of_birth || candidate.state_of_origin) && (
        <Card>
          <CardHeader>
            <CardTitle>Personal details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {candidate.date_of_birth && (
                <>
                  <dt className="text-muted-foreground">Date of birth</dt>
                  <dd className="font-medium">
                    {new Date(candidate.date_of_birth).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </dd>
                </>
              )}
              {candidate.state_of_origin && (
                <>
                  <dt className="text-muted-foreground">State of origin</dt>
                  <dd className="font-medium">{candidate.state_of_origin}</dd>
                </>
              )}
              {candidate.local_government && (
                <>
                  <dt className="text-muted-foreground">LGA</dt>
                  <dd className="font-medium">{candidate.local_government}</dd>
                </>
              )}
              {candidate.party_affiliation && (
                <>
                  <dt className="text-muted-foreground">Party</dt>
                  <dd className="font-medium">{candidate.party_affiliation}</dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
