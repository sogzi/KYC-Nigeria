/**
 * GET /api/candidates-list
 * Returns a lightweight list of candidates for use in admin dropdowns.
 */

import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('candidates')
    .select('id, full_name, party_affiliation')
    .order('full_name');

  if (error) return Response.json({ candidates: [] });
  return Response.json({ candidates: data ?? [] });
}
