import Link from 'next/link';
import { requireAdminUser } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { Users, CheckSquare, Flag, ScrollText, ChevronRight } from 'lucide-react';
import type { Row } from '@/types';

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  Icon,
  href,
}: {
  label: string;
  value: number | string;
  Icon: React.ElementType;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border bg-card p-5
                 hover:bg-muted/30 transition-colors group"
    >
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className="flex items-center gap-2">
        <Icon className="h-8 w-8 text-muted-foreground/40" />
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

// ── Recent audit rows ─────────────────────────────────────────────────────────

function AuditRow({ row }: { row: Row<'audit_log'> }) {
  const actionColor: Record<string, string> = {
    insert: 'text-green-600',
    update: 'text-blue-600',
    delete: 'text-destructive',
  };
  const date = new Date(row.changed_at ?? '').toLocaleString('en-NG', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <tr className="border-b last:border-0 text-sm">
      <td className="py-2 pr-4 font-medium">{row.table_name}</td>
      <td className={`py-2 pr-4 font-medium capitalize ${actionColor[row.action] ?? ''}`}>
        {row.action}
      </td>
      <td className="py-2 pr-4 text-muted-foreground truncate max-w-[200px]">
        {row.changed_by_username ?? '—'}
      </td>
      <td className="py-2 text-muted-foreground whitespace-nowrap">{date}</td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const admin   = await requireAdminUser();
  const supabase = createAdminClient();

  // Fetch counts in parallel
  const [candidatesRes, pendingFlagsRes, factChecksRes, recentAuditRes] = await Promise.all([
    supabase.from('candidates').select('id', { count: 'exact', head: true }),
    supabase.from('moderation_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('fact_checks').select('id', { count: 'exact', head: true }),
    supabase.from('audit_log').select('*').order('changed_at', { ascending: false }).limit(10),
  ]);

  const totalCandidates = candidatesRes.count ?? 0;
  const pendingFlags    = pendingFlagsRes.count ?? 0;
  const totalFactChecks = factChecksRes.count ?? 0;
  const recentAudit     = (recentAuditRes.data ?? []) as Row<'audit_log'>[];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Welcome back, {admin.profile.username}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Candidates"
          value={totalCandidates}
          Icon={Users}
          href="/admin/candidates"
        />
        <StatCard
          label="Pending Flags"
          value={pendingFlags}
          Icon={Flag}
          href="/admin/moderation"
        />
        <StatCard
          label="Fact Checks"
          value={totalFactChecks}
          Icon={CheckSquare}
          href="/admin/fact-checks"
        />
        <StatCard
          label="Audit Events"
          value="→"
          Icon={ScrollText}
          href="/admin/audit-log"
        />
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Recent Activity</h2>
          <Link href="/admin/audit-log" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            View all →
          </Link>
        </div>
        <div className="px-5 py-2 overflow-x-auto">
          {recentAudit.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="py-2 pr-4 text-left font-medium">Table</th>
                  <th className="py-2 pr-4 text-left font-medium">Action</th>
                  <th className="py-2 pr-4 text-left font-medium">By</th>
                  <th className="py-2 text-left font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {recentAudit.map((row) => (
                  <AuditRow key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
