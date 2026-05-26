import Link from 'next/link';
import { requireAdminUser } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import type { ColumnDef } from '@tanstack/react-table';
import type { Row } from '@/types';
import { Plus, ExternalLink } from 'lucide-react';

type Speech = Row<'speeches'>;
type Candidate = Pick<Row<'candidates'>, 'id' | 'full_name'>;

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing:  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed:   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  failed:      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? 'pending';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[s] ?? STATUS_STYLES.pending}`}>
      {s}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminSpeechesPage() {
  await requireAdminUser();
  const supabase = createAdminClient();

  const [speechesRes, candidatesRes] = await Promise.all([
    supabase
      .from('speeches')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('candidates')
      .select('id, full_name')
      .order('full_name'),
  ]);

  const speeches   = (speechesRes.data   ?? []) as Speech[];
  const candidates = (candidatesRes.data ?? []) as Candidate[];
  const candidateMap = Object.fromEntries(candidates.map((c) => [c.id, c.full_name]));

  const columns: ColumnDef<Speech>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ getValue }) => (
        <span className="font-medium text-sm">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'candidate_id',
      header: 'Candidate',
      cell: ({ getValue }) => candidateMap[getValue() as string] ?? '—',
    },
    {
      accessorKey: 'transcription_status',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue() as string | null} />,
    },
    {
      accessorKey: 'ai_translated',
      header: 'Translated',
      cell: ({ getValue }) => (
        <span className={`text-xs ${getValue() ? 'text-green-600' : 'text-muted-foreground'}`}>
          {getValue() ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        if (!v) return '—';
        return new Date(v).toLocaleDateString('en-NG', { dateStyle: 'medium' });
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/api/speeches/${row.original.id}/audio`} target="_blank">
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
              Audio
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Speeches</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{speeches.length} total</p>
        </div>
        <Link href="/admin/speeches/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Upload speech
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={speeches}
        searchColumn="title"
        searchPlaceholder="Search speeches…"
      />
    </div>
  );
}
