'use client';

/**
 * FlagButton — hover-only misinformation report trigger.
 *
 * Usage:
 *   <div className="group relative">
 *     {content}
 *     <FlagButton contentType="manifesto" contentId={section.id} />
 *   </div>
 *
 * The button is invisible by default and fades in on group-hover or touch.
 * On click it opens a compact modal with reason options. Submission goes to
 * the moderation_queue table via a server action.
 */

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { TriangleAlert, CheckCircle2, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { flagContent, type FlagState } from '@/app/actions/moderation';

// ── Reason options ────────────────────────────────────────────────────────────

const REASONS = [
  { value: 'wrong_info',       label: 'Wrong information' },
  { value: 'missing_context',  label: 'Missing context' },
  { value: 'outdated',         label: 'Outdated information' },
  { value: 'other',            label: 'Other' },
] as const;

type ReasonValue = typeof REASONS[number]['value'];

// ── Submit button ─────────────────────────────────────────────────────────────

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending} className="gap-2">
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {pending ? 'Submitting…' : 'Submit report'}
    </Button>
  );
}

// ── Flag modal ────────────────────────────────────────────────────────────────

function FlagModal({
  open,
  onClose,
  contentType,
  contentId,
}: {
  open: boolean;
  onClose: () => void;
  contentType: string;
  contentId: string;
}) {
  const initial: FlagState = { status: 'idle', message: '' };
  const [state, formAction] = useFormState(flagContent, initial);
  const [selected, setSelected] = useState<ReasonValue | null>(null);

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-amber-500" />
            Report an issue
          </DialogTitle>
          <DialogDescription>
            What&apos;s incorrect about this content? We&apos;ll review your report.
          </DialogDescription>
        </DialogHeader>

        {state.status === 'success' ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <p className="text-sm font-medium">{state.message}</p>
            <Button variant="outline" size="sm" onClick={handleClose}>
              Close
            </Button>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            {/* Hidden fields */}
            <input type="hidden" name="content_type" value={contentType} />
            <input type="hidden" name="content_id"   value={contentId} />

            {/* Reason picker */}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">What&apos;s the issue?</legend>
              <div className="grid grid-cols-2 gap-2">
                {REASONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                      selected === value
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'hover:bg-muted',
                    )}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={value}
                      required
                      className="sr-only"
                      onChange={() => setSelected(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Optional note */}
            <div className="space-y-1.5">
              <label htmlFor="flag-note" className="text-sm font-medium">
                Additional details{' '}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <textarea
                id="flag-note"
                name="user_note"
                rows={3}
                maxLength={500}
                placeholder="Provide more context, a source link, etc."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {/* Error */}
            {state.status === 'error' && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {state.message}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <SubmitButton />
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

interface Props {
  contentType: 'manifesto' | 'track_record' | 'speech' | 'candidate';
  contentId: string;
  /** Pass additional className to position the button within its parent. */
  className?: string;
}

export function FlagButton({ contentType, contentId, className }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        aria-label="Report an issue with this content"
        title="Report an issue"
        className={cn(
          // Invisible until group-hover or focus — non-intrusive
          'opacity-0 group-hover:opacity-100 focus:opacity-100',
          'transition-opacity duration-150',
          'flex h-6 w-6 items-center justify-center rounded',
          'text-muted-foreground/50 hover:text-amber-500 hover:bg-amber-50',
          'dark:hover:bg-amber-950/30',
          className,
        )}
      >
        <TriangleAlert className="h-3.5 w-3.5" />
      </button>

      <FlagModal
        open={open}
        onClose={() => setOpen(false)}
        contentType={contentType}
        contentId={contentId}
      />
    </>
  );
}
