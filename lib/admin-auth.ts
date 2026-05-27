/**
 * Admin authentication helpers.
 *
 * These functions run on the server (RSC, Route Handlers, Server Actions).
 * They verify the Supabase Auth session AND confirm the user has a row in
 * admin_profiles (preventing any auth user from accessing admin).
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import type { Database } from '@/types/database.types';
import type { AdminProfile } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AdminUser = {
  id: string;           // auth.users.id
  email: string;
  profile: AdminProfile;
};

// ── Internal client (uses service role for admin_profiles lookup) ─────────────

function makeAdminClient() {
  const { createServerClient: mkAdmin } = require('@supabase/ssr') as typeof import('@supabase/ssr');
  return mkAdmin<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
}

// ── Session client (reads cookies for the current user's session) ─────────────

async function makeSessionClient() {
  const cookieStore = await cookies();
  const { createServerClient: mkSession } = require('@supabase/ssr') as typeof import('@supabase/ssr');
  return mkSession<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cs: { name: string; value: string; options: object }[]) {
          try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* RSC — cookie writes are no-op */ }
        },
      },
    },
  );
}

// ── Public helpers ────────────────────────────────────────────────────────────

/**
 * Get the currently logged-in admin user.
 * Returns null if no valid session or user is not in admin_profiles.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const sessionClient = await makeSessionClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) return null;

  const adminClient = makeAdminClient();
  const { data: profile } = await adminClient
    .from('admin_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile) return null;

  return {
    id:      user.id,
    email:   user.email ?? '',
    profile: profile as AdminProfile,
  };
}

/**
 * Like getAdminUser() but redirects to /admin/login if not authenticated.
 * Use in every admin page / server action that requires auth.
 */
export async function requireAdminUser(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin/login');
  return admin;
}
