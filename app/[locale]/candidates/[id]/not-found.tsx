import Link from 'next/link';
import { SearchX, ArrowLeft } from 'lucide-react';

export default function CandidateNotFound() {
  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <SearchX className="h-16 w-16 text-muted-foreground" strokeWidth={1.5} />

      <h1 className="mt-6 text-2xl font-bold">Candidate not found</h1>
      <p className="mt-3 text-muted-foreground">
        We couldn't find a candidate matching this ID. They may have been removed
        or the link may be incorrect.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/en/candidates"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 transition-opacity"
        >
          Browse all candidates
        </Link>
        <Link
          href="/en"
          className="inline-flex items-center justify-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Go home
        </Link>
      </div>
    </div>
  );
}
