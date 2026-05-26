import { Skeleton } from '@/components/ui/skeleton';

export default function CompareLoading() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-10 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      {/* Selector card */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-40 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-14 w-44 rounded-lg" />
          <Skeleton className="h-14 w-44 rounded-lg" />
          <Skeleton className="h-14 w-36 rounded-lg border-dashed" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Sticky header */}
        <div className="flex border-b">
          <div className="w-40 shrink-0 border-r h-24 bg-muted/20" />
          {[1, 2].map((i) => (
            <div key={i} className="flex-1 border-l p-4 space-y-2">
              <Skeleton className="mx-auto h-12 w-12 rounded-full" />
              <Skeleton className="mx-auto h-4 w-24" />
              <Skeleton className="mx-auto h-3 w-16 rounded-full" />
            </div>
          ))}
        </div>

        {/* Section rows */}
        {[
          ['Education', 3],
          ['Public Service', 3],
          ['Manifesto', 4],
          ['Track Record', 4],
        ].map(([title, count]) => (
          <div key={title as string}>
            <div className="flex border-t-2 border-border bg-muted/40 px-3 py-2.5">
              <div className="w-40 shrink-0">
                <Skeleton className="h-3.5 w-20" />
              </div>
            </div>
            {Array.from({ length: count as number }).map((_, i) => (
              <div key={i} className="flex border-b border-border/50">
                <div className="sticky left-0 z-10 w-40 shrink-0 border-r bg-card px-3 py-3">
                  <Skeleton className="h-3 w-24" />
                </div>
                {[1, 2].map((j) => (
                  <div key={j} className="flex-1 border-l px-3 py-3 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
