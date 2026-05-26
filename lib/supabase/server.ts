import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

/**
 * Server-side (RSC / Route Handler / Server Action) Supabase client.
 * Always uses the anon key — reads are unrestricted by RLS public policies.
 * For admin mutations, import createAdminClient() instead.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component — cookie writes are a no-op here; the
            // middleware handles session refresh automatically.
          }
        },
      },
    },
  );
}

/**
 * Admin client using the service role key.
 * Bypasses RLS — only call from trusted server-side code (Route Handlers,
 * Server Actions). Never expose the service role key to the browser.
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  );
}
