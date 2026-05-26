import { requireAdminUser } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { FactCheckManager } from './fact-check-manager';
import type { Row } from '@/types';

type FactCheck = Row<'fact_checks'>;
type Candidate = Pick<Row<'candidates'>, 'id' | 'full_name' | 'party_affiliation'>;

export default async function AdminFactChecksPage() {
  await requireAdminUser();
  const supabase = createAdminClient();

  const [factChecksRes, candidatesRes] = await Promise.all([
    supabase
      .from('fact_checks')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('candidates')
      .select('id, full_name, party_affiliation')
      .order('full_name'),
  ]);

  const factChecks  = (factChecksRes.data  ?? []) as FactCheck[];
  const candidates  = (candidatesRes.data  ?? []) as Candidate[];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Fact Checks</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{factChecks.length} total</p>
      </div>
      <FactCheckManager factChecks={factChecks} candidates={candidates} />
    </div>
  );
}
