import { requireAdminUser } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import type { Row } from '@/types';

type AuditEntry = Row<'audit_log'>;

// ── Action colour ─────────────────────────────────────────────────────────────

const ACTION_STYLES: Record<string, string> = {
  insert: 'text-green-600 font-medium',
  update: 'text-blue-600 font-medium',
  delete: 'text-destructive font-medium',
};

// ── Columns ───────────────────────────────────────────────────────────────────

const columns: ColumnDef<AuditEntry>[] = [
  {
    accessorKey: 'changed_at',
    header: 'Time',
    cell: ({ getValue }) => (
      <span className="text-xs whitespace-nowrap text-muted-foreground">
        {new Date(getValue() as string).toLocaleString('en-NG', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
      </span>
    ),
  },
  {
    accessorKey: 'changed_by_username',
    header: 'Admin',
    cell: ({ getValue }) => (
      <span className="font-medium text-sm">{(getValue() as string | null) ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'table_name',
    header: 'Table',
    cell: ({ getValue }) => (
      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{getValue() as string}</code>
    ),
  },
  {
    accessorKey: 'action',
    header: 'Action',
    cell: ({ getValue }) => {
      const v = getValue() as string;
      return (
        <span className={`capitalize text-sm ${ACTION_STYLES[v] ?? ''}`}>{v}</span>
      );
    },
  },
  {
    accessorKey: 'record_id',
    header: 'Record ID',
    cell: ({ getValue }) => (
      <code className="text-xs text-muted-foreground font-mono">{(getValue() as string).slice(0, 8)}…</code>
    ),
  },
  {
    accessorKey: 'changed_fields',
    header: 'Changed fields',
    enableSorting: false,
    cell: ({ getValue }) => {
      const fields = getValue() as string[] | null;
      if (!fields?.length) return <span className="text-muted-foreground text-xs">—</span>;
      return (
        <div className="flex flex-wrap gap-1 max-w-[240px]">
          {fields.slice(0, 5).map((f) => (
            <code key={f} className="rounded bg-muted px-1 text-xs">{f}</code>
          ))}
          {fields.length > 5 && (
            <span className="text-xs text-muted-foreground">+{fields.length - 5} more</span>
          )}
        </div>
      );
    },
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminAuditLogPage() {
  await requireAdminUser();
  const supabase = createAdminClient();

  const { data: raw } = await supabase
    .from('audit_log')
    .select('*')
    .order('changed_at', { ascending: false })
    .limit(500);

  const entries = (raw ?? []) as AuditEntry[];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          All admin mutations — showing last {entries.length}
        </p>
      </div>

      <DataTable
        columns={columns}
        data={entries}
        searchColumn="changed_by_username"
        searchPlaceholder="Filter by admin username…"
        pageSize={25}
      />
    </div>
  );
}
