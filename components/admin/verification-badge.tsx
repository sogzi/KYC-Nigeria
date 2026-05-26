import { BadgeCheck } from 'lucide-react';

interface Props {
  verifiedAt: string;
  verifiedBy?: string | null;
}

/**
 * "Data last verified on [date] by [admin]" badge.
 * Shown on public candidate profiles when `last_verified_at` is set.
 */
export function VerificationBadge({ verifiedAt, verifiedBy }: Props) {
  const date = new Date(verifiedAt).toLocaleDateString('en-NG', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  });

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
      <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
      <span>
        Data verified {date}
        {verifiedBy ? ` by ${verifiedBy}` : ''}
      </span>
    </div>
  );
}
