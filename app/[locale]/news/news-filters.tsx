'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { cn } from '@/lib/utils';

const POLICY_FILTER_OPTIONS = [
  { value: '',               label: 'All Topics' },
  { value: 'economy',        label: 'Economy' },
  { value: 'security',       label: 'Security' },
  { value: 'election process', label: 'Elections' },
  { value: 'governance',     label: 'Governance' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'education',      label: 'Education' },
  { value: 'health',         label: 'Health' },
  { value: 'energy',         label: 'Energy' },
  { value: 'corruption',     label: 'Corruption' },
  { value: 'youth',          label: 'Youth' },
] as const;

const SENTIMENT_OPTIONS = [
  { value: '',         label: 'Any Tone' },
  { value: 'positive', label: 'Positive' },
  { value: 'neutral',  label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
  { value: 'mixed',    label: 'Mixed' },
] as const;

interface Props {
  currentTag:       string;
  currentSentiment: string;
}

export function NewsFilters({ currentTag, currentSentiment }: Props) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Policy tag chips */}
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Topic
        </p>
        <div className="flex flex-wrap gap-1.5">
          {POLICY_FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => updateFilter('tag', value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                currentTag === value
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'bg-secondary text-gray-600 hover:bg-muted',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sentiment chips */}
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Tone
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SENTIMENT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => updateFilter('sentiment', value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                currentSentiment === value
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'bg-secondary text-gray-600 hover:bg-muted',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
