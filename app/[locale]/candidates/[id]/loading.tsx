import { Skeleton } from '@/components/ui/skeleton';

export default function CandidateProfileLoading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-10 space-y-6">
      {/* Hero skeleton */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="h-3 w-full animate-pulse bg-muted" />
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Skeleton className="h-24 w-24 rounded-full shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-56" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
          {/* Stats bar skeleton */}
          <div className="mt-5 grid grid-cols-3 divide-x rounded-lg border bg-muted/40">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1 py-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex gap-0 border-b overflow-x-auto">
          {[120, 100, 110, 80, 90, 100].map((w, i) => (
            <div key={i} className="px-4 py-3 border-b-2 border-transparent">
              <Skeleton className={`h-4`} style={{ width: `${w}px` }} />
            </div>
          ))}
        </div>
        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="pt-4 space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    </div>
  );
}
