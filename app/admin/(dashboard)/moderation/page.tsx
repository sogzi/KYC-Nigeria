import { requireAdminUser } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { ModerationQueue } from './moderation-queue';
import type { Row } from '@/types';

type ModerationItem = Row<'moderation_queue'>;

export default async function AdminModerationPage() {
  await requireAdminUser();
  const supabase = createAdminClient();

  const [pendingRes, reviewedRes, dismissedRes] = await Promise.all([
    supabase
      .from('moderation_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('moderation_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'reviewed'),
    supabase
      .from('moderation_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'dismissed'),
  ]);

  const pending   = (pendingRes.data  ?? []) as ModerationItem[];
  const reviewed  = reviewedRes.count  ?? 0;
  const dismissed = dismissedRes.count ?? 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Content Moderation</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Review flagged content submitted by the public
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending review', value: pending.length, color: 'text-yellow-600' },
          { label: 'Reviewed',       value: reviewed,       color: 'text-green-600'  },
          { label: 'Dismissed',      value: dismissed,      color: 'text-muted-foreground' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Queue */}
      <ModerationQueue items={pending} />
    </div>
  );
}
