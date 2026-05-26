import { Users, ArrowUp } from 'lucide-react';

interface Props {
  count: number; // how many candidates are already selected (0, 1)
}

export function EmptyState({ count }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-16 text-center">
      <Users className="h-12 w-12 text-muted-foreground/40" strokeWidth={1.25} />
      <h2 className="mt-4 text-lg font-semibold">
        {count === 0
          ? 'Select candidates to compare'
          : 'Add one more candidate'}
      </h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        {count === 0
          ? 'Use the selector above to choose up to 3 candidates. Compare their education, track record, manifesto positions, and more.'
          : 'You need at least 2 candidates for a side-by-side comparison.'}
      </p>
      <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground animate-bounce">
        <ArrowUp className="h-3.5 w-3.5" />
        Add candidate above
      </p>
    </div>
  );
}
