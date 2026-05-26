'use client';

import { useFormState } from 'react-dom';
import { updateFlagStatusAction } from '@/app/actions/moderation';
import { Button } from '@/components/ui/button';
import type { Row } from '@/types';
import { CheckCircle, XCircle, Flag, Clock } from 'lucide-react';

type ModerationItem = Row<'moderation_queue'>;

// ── Status buttons ────────────────────────────────────────────────────────────

function StatusActions({ item }: { item: ModerationItem }) {
  const [, formAction] = useFormState(updateFlagStatusAction, { status: 'idle' as const, message: '' });

  return (
    <div className="flex items-center gap-2">
      <form action={formAction}>
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="status" value="reviewed" />
        <Button type="submit" size="sm" variant="outline" className="gap-1.5 h-7 text-green-700 border-green-300 hover:bg-green-50">
          <CheckCircle className="h-3.5 w-3.5" />
          Review
        </Button>
      </form>
      <form action={formAction}>
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="status" value="dismissed" />
        <Button type="submit" size="sm" variant="ghost" className="gap-1.5 h-7 text-muted-foreground">
          <XCircle className="h-3.5 w-3.5" />
          Dismiss
        </Button>
      </form>
    </div>
  );
}

// ── Content type badge ────────────────────────────────────────────────────────

const CONTENT_LABELS: Record<string, string> = {
  manifesto:   'Manifesto',
  track_record: 'Track Record',
  speech:      'Speech',
};

// ── Reason badge ──────────────────────────────────────────────────────────────

const REASON_LABELS: Record<string, string> = {
  wrong_info:       'Wrong information',
  missing_context:  'Missing context',
  outdated:         'Outdated',
  other:            'Other',
};

// ── Queue ─────────────────────────────────────────────────────────────────────

export function ModerationQueue({ items }: { items: ModerationItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground space-y-2">
        <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
        <p className="font-medium">All caught up!</p>
        <p className="text-sm">No pending flags to review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">Pending ({items.length})</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {CONTENT_LABELS[item.content_type] ?? item.content_type}
                  </span>
                  <span className="rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 text-xs font-medium">
                    {REASON_LABELS[item.reason] ?? item.reason}
                  </span>
                </div>

                <p className="font-medium text-sm line-clamp-2">
                  Record ID: <code className="font-mono text-xs bg-muted rounded px-1">{item.content_id}</code>
                </p>

                {item.user_note && (
                  <p className="text-sm text-muted-foreground italic">"{item.user_note}"</p>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap shrink-0">
                <Clock className="h-3 w-3" />
                {new Date(item.created_at ?? '').toLocaleDateString('en-NG', {
                  dateStyle: 'medium',
                })}
              </div>
            </div>

            <StatusActions item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
