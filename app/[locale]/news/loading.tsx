import { Skeleton } from '@/components/ui/skeleton';

export default function NewsLoading() {
  return (
    <div className="bg-brand-bg min-h-screen">
      {/* Page header skeleton */}
      <div className="border-b bg-white px-4 py-8">
        <div className="container mx-auto max-w-6xl">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="mt-2 h-4 w-80 rounded" />
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        {/* Filter chips skeleton */}
        <div className="mb-6 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>

        {/* News card grid skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 overflow-hidden rounded-xl border bg-white p-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <Skeleton className="h-5 w-full rounded" />
              <Skeleton className="h-5 w-5/6 rounded" />
              <Skeleton className="h-12 w-full rounded" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
