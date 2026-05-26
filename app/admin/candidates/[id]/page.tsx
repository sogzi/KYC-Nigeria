import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminUser } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { CandidateForm } from '../candidate-form';
import { ChevronLeft } from 'lucide-react';
import type { Row } from '@/types';

type Candidate = Row<'candidates'>;

interface Props {
  params: { id: string };
}

export default async function EditCandidatePage({ params }: Props) {
  await requireAdminUser();
  const supabase = createAdminClient();

  const { data: raw } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!raw) notFound();
  const candidate = raw as Candidate;

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
        <h1 className="text-2xl font-bold">Edit candidate</h1>
        <p className="text-muted-foreground text-sm">{candidate.full_name}</p>
      </div>

      <CandidateForm candidate={candidate} />
    </div>
  );
}
