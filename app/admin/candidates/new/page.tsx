import Link from 'next/link';
import { requireAdminUser } from '@/lib/admin-auth';
import { CandidateForm } from '../candidate-form';
import { ChevronLeft } from 'lucide-react';

export default async function NewCandidatePage() {
  await requireAdminUser();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <Link
          href="/admin/candidates"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Candidates
        </Link>
        <h1 className="text-2xl font-bold">Add candidate</h1>
      </div>

      <CandidateForm />
    </div>
  );
}
