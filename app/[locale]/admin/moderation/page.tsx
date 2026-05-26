import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ShieldAlert, TriangleAlert, CheckCircle2, XCircle } from 'lucide-react';
import { locales, type Locale } from '@/i18n/config';
import { getModerationQueue } from '@/app/actions/moderation';
import { cn } from '@/lib/utils';
import type { ModerationQueueRow } from '@/types';

export const metadata: Metadata = {
  title: 'Moderation Queue — Admin | KYC Nigeria',
};

export const dynamic = 'force-dynamic';

type Props = { params: { locale: string } };

// ── Helpers ───────────────────────────────────────────────────────────────────

const REASON_LABELS: Record<ModerationQueueRow['reason'], string> = {
  wrong_info:      'Wrong information',
  missing_context: 'Missing context',
  outdated:        'Outdated information',
  other:           'Other',
};

const TYPE_LABELS: Record<ModerationQueueRow['content_type'], string> = {
  manifesto:    'Manifesto point',
  track_record: 'Track record',
  speech:       'Speech / transcript',
  candidate:    'Candidate',
};

const STATUS_STYLES: Record<ModerationQueueRow['status'], string> = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300',
  reviewed:  'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300',
  dismissed: 'bg-muted text-muted-foreground border-border',
};

function StatusBadge({ status }: { status: ModerationQueueRow['status'] }) {
  return (
    <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize', STATUS_STYLES[status])}>
      {status}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ModerationPage({ params }: Props) {
  const locale = locales.includes(params.locale as Locale)
    ? (params.locale as Locale)
    : 'en';
  setRequestLocale(locale);

  // Fetch pending and recently reviewed flags in parallel
  const [pending, reviewed] = await Promise.all([
    getModerationQueue('pending'),
    getModerationQueue('reviewed'),
  ]).catch(() => [[], []] as [ModerationQueueRow[], ModerationQueueRow[]]);

  const dismissed = await getModerationQueue('dismissed').catch(() => [] as ModerationQueueRow[]);

  const all = [
    ...pending,
    ...reviewed.slice(0, 20),
    ...dismissed.slice(0, 10),
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
          <TriangleAlert className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Moderation Queue</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Content flags submitted by users. Review and resolve each one.
          </p>
        </div>
      </div>

      {/* ── Auth notice ── */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p><strong>Admin area.</strong> Protect this route with authentication before deploying.</p>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        {[
          { label: 'Pending',   count: pending.length,   colour: 'text-amber-600 dark:text-amber-400' },
          { label: 'Reviewed',  count: reviewed.length,  colour: 'text-green-600 dark:text-green-400' },
          { label: 'Dismissed', count: dismissed.length, colour: 'text-muted-foreground' },
        ].map(({ label, count, colour }) => (
          <div key={label} className="rounded-lg border bg-card p-3">
            <p className={cn('text-2xl font-bold', colour)}>{count}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Flag table ── */}
      {all.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-400/60" strokeWidth={1.25} />
          <p className="mt-4 font-semibold">Queue is clear</p>
          <p className="mt-1 text-sm text-muted-foreground">No flags to review.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  {['Status', 'Type', 'Reason', 'Note', 'Submitted', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {all.map((flag) => (
                  <tr key={flag.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={flag.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {TYPE_LABELS[flag.content_type]}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium">
                      {REASON_LABELS[flag.reason]}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate text-xs text-muted-foreground">
                        {flag.user_note ?? <span className="italic">—</span>}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5 truncate">
                        {flag.content_id}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(flag.created_at).toLocaleDateString('en-NG', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {flag.status === 'pending' && (
                        <div className="flex gap-2">
                          <ReviewButton flagId={flag.id} action="reviewed" />
                          <ReviewButton flagId={flag.id} action="dismissed" />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Review action buttons (inline server action) ──────────────────────────────

import { updateFlagStatus } from '@/app/actions/moderation';
import { revalidatePath } from 'next/cache';

async function reviewFlag(formData: FormData) {
  'use server';
  const id     = formData.get('id')     as string;
  const action = formData.get('action') as 'reviewed' | 'dismissed';
  if (!id || !action) return;
  await updateFlagStatus(id, action);
  revalidatePath('/[locale]/admin/moderation', 'page');
}

function ReviewButton({ flagId, action }: { flagId: string; action: 'reviewed' | 'dismissed' }) {
  const isReview = action === 'reviewed';
  return (
    <form action={reviewFlag}>
      <input type="hidden" name="id"     value={flagId} />
      <input type="hidden" name="action" value={action} />
      <button
        type="submit"
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-md border text-xs transition-colors',
          isReview
            ? 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950/30'
            : 'border-border text-muted-foreground hover:bg-muted',
        )}
        title={isReview ? 'Mark as reviewed' : 'Dismiss'}
      >
        {isReview ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      </button>
    </form>
  );
}
