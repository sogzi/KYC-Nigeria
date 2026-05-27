'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

async function makeClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cs: { name: string; value: string; options: Parameters<typeof cookieStore.set>[2] }[]) {
          cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );
}

export type LoginState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

// ── Login ─────────────────────────────────────────────────────────────────────

export async function adminLogin(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email    = (formData.get('email')    as string | null)?.trim();
  const password = (formData.get('password') as string | null);
  const next     = (formData.get('next')     as string | null) ?? '/admin';

  if (!email || !password) {
    return { status: 'error', message: 'Email and password are required.' };
  }

  const supabase = await makeClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      status:  'error',
      message: error.message === 'Invalid login credentials'
        ? 'Invalid email or password.'
        : error.message,
    };
  }

  // Verify the user has an admin_profiles row (i.e., they're actually an admin)
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { createAdminClient } = await import('@/lib/supabase/server');
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from('admin_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      await supabase.auth.signOut();
      return {
        status:  'error',
        message: 'Your account does not have admin access. Contact a super admin.',
      };
    }
  }

  redirect(next);
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function adminLogout(): Promise<void> {
  const supabase = await makeClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
