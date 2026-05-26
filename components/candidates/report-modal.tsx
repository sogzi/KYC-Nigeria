'use client';

import { useState } from 'react';
import { Flag, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

const REPORT_CATEGORIES = [
  'Photo',
  'Biography',
  'Party / Election info',
  'Manifesto',
  'Track Record',
  'Asset Declaration',
  'Fact Check',
  'Other',
];

interface Props {
  candidateName: string;
  candidateId: string;
}

export function ReportModal({ candidateName, candidateId }: Props) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [category, setCategory] = useState('');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: POST to /api/reports or Supabase edge function
    await new Promise((r) => setTimeout(r, 600)); // simulate latency
    setLoading(false);
    setSubmitted(true);
  };

  const handleClose = (v: boolean) => {
    setOpen(v);
    if (!v) {
      setTimeout(() => {
        setSubmitted(false);
        setCategory('');
        setDetails('');
        setEmail('');
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Flag className="h-4 w-4" />
          Report incorrect info
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <DialogTitle>Thank you for your report</DialogTitle>
            <DialogDescription>
              We'll review the information about{' '}
              <strong>{candidateName}</strong> and update the profile if needed.
            </DialogDescription>
            <Button onClick={() => handleClose(false)}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Report incorrect information</DialogTitle>
              <DialogDescription>
                Help us keep <strong>{candidateName}</strong>'s profile accurate.
              </DialogDescription>
            </DialogHeader>

            {/* Hidden candidate ID for future API use */}
            <input type="hidden" name="candidateId" value={candidateId} />

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="category">
                What is incorrect? <span className="text-destructive">*</span>
              </label>
              <select
                id="category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a category…</option>
                {REPORT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="details">
                Details <span className="text-destructive">*</span>
              </label>
              <textarea
                id="details"
                required
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe what is wrong and, if possible, provide a source…"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="email">
                Your email{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="we'll only use this to follow up"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting…' : 'Submit report'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
