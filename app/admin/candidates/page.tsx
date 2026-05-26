import Link from 'next/link';
import { requireAdminUser } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { DeleteCandidateButton } from './delete-button';
import type { ColumnDef } from '@tanstack/react-table';
import type { Row } from '@/types';
import { Plus, Pencil, BadgeCheck } from 'lucide-react';

type Candidate = Row<'candidates'>;

// ── Columns ───────────────────────────────────────────────────────────────────

const columns: ColumnDef<Candidate>[] = [
  {
    accessorKey: 'full_name',
    header: 'Name',
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <span className="font-medium">{row.original.full_name}</span>
        {row.original.is_verified && (
          <BadgeCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
        )}
      </div>
    ),
  },
  {
    accessorKey: 'party_affiliation',
    header: 'Party',
    cell: ({ getValue }) => (
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: 'election_type',
    header: 'Election',
    cell: ({ getValue }) => (
      <span className="capitalize">{(getValue() as string).replace('_', ' ')}</span>
    ),
  },
  {
    accessorKey: 'state',
    header: 'State',
    cell: ({ getValue }) => (getValue() as string | null) ?? '—',
  },
  {
    accessorKey: 'last_verified_at',
    header: 'Last verified',
    cell: ({ getValue }) => {
      const v = getValue() as string | null;
      if (!v) return <span className="text-muted-foreground text-xs">Never</span>;
      return (
        <span className="text-xs">
          {new Date(v).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
        </span>
      );
    },
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-1 justify-end">
        <Link href={`/admin/candidates/${row.original.id}`}>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Pencil className="h-3.5 w-3.5" />
            <span className="sr-only">Edit</span>
          </Button>
        </Link>
        <DeleteCandidateButton id={row.original.id} name={row.original.full_name} />
      </div>
    ),
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminCandidatesPage() {
  await requireAdminUser();
  const supabase = createAdminClient();

  const { data: raw } = await supabase
    .from('candidates')
    .select('*')
    .order('full_name');

  const candidates = (raw ?? []) as Candidate[];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Candidates</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{candidates.length} total</p>
        </div>
        <Link href="/admin/candidates/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add candidate
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={candidates}
        searchColumn="full_name"
        searchPlaceholder="Search candidates…"
      />
    </div>
  );
}
