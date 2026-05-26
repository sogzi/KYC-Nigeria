'use client';

import { ExternalLink } from 'lucide-react';
import { RECORD_TYPE_CONFIG } from '@/lib/party-config';
import { FlagButton } from '@/components/moderation/flag-button';
import type { TrackRecord } from '@/types';

interface Props {
  trackRecords: TrackRecord[];
}

const RECORD_TYPE_LABEL: Record<string, string> = {
  achievement: 'Achievement',
  controversy: 'Controversy',
  conviction:  'Conviction',
  policy:      'Policy',
  appointment: 'Appointment',
};

export function TrackRecordTab({ trackRecords }: Props) {
  if (!trackRecords.length) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        <p className="font-medium">No track record entries available yet.</p>
      </div>
    );
  }

  // Group by year for timeline display
  const byYear = trackRecords.reduce<Record<number, TrackRecord[]>>((acc, r) => {
    (acc[r.year] ??= []).push(r);
    return acc;
  }, {});

  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-2">
      {/* Transparency notice */}
      <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
        Both achievements and controversies are shown to give you a complete picture.
        Controversies and convictions are <strong>never hidden</strong>.
      </p>

      <div className="relative ml-4 space-y-8 pt-4">
        {/* Vertical line */}
        <div className="absolute left-0 top-0 h-full w-px bg-border" />

        {years.map((year) => (
          <div key={year}>
            {/* Year label */}
            <div className="relative mb-4 flex items-center gap-3">
              <div className="absolute -left-[17px] h-8 w-8 rounded-full border-2 border-primary bg-background flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary leading-none">
                  {String(year).slice(2)}
                </span>
              </div>
              <h3 className="ml-8 text-sm font-bold text-muted-foreground">{year}</h3>
            </div>

            {/* Records in this year */}
            <div className="ml-8 space-y-3">
              {byYear[year].map((record) => {
                const config =
                  RECORD_TYPE_CONFIG[record.record_type] ?? RECORD_TYPE_CONFIG.policy;

                return (
                  // 'group' enables hover-reveal on the flag button
                  <div
                    key={record.id}
                    className={`group relative rounded-lg border bg-card p-4 border-l-4 pr-10 ${config.border}`}
                  >
                    {/* Flag button — top-right, hover-only */}
                    <FlagButton
                      contentType="track_record"
                      contentId={record.id}
                      className="absolute right-2 top-2"
                    />

                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${config.badge}`}
                          >
                            {RECORD_TYPE_LABEL[record.record_type] ?? record.record_type}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm leading-snug">{record.title}</h4>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                          {record.description}
                        </p>
                      </div>
                    </div>

                    {record.source_url && (
                      <a
                        href={record.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Source
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
