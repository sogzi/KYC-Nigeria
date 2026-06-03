import { type NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { locales, defaultLocale } from './i18n/config';

// ── i18n middleware ───────────────────────────────────────────────────────────
// Handles locale detection and redirects for all public routes.
// localePrefix:'always' means / → /en, /candidates → /en/candidates, etc.
// Already-localised paths (/en/...) are passed through without redirecting.

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

// ── Admin auth guard ──────────────────────────────────────────────────────────

async function adminMiddleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Login page is always public — no auth check.
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: object }[]) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

// ── Combined middleware ───────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes → auth guard (never goes through intl middleware)
  if (pathname.startsWith('/admin')) {
    return adminMiddleware(request);
  }

  // All public routes → intl middleware
  // - / redirects to /en
  // - /en/... passes through (already localised)
  // - /candidates redirects to /en/candidates
  // No loop possible because app/page.tsx no longer exists to double-redirect.
  return intlMiddleware(request);
}

export const config = {
  // All routes except Next.js internals, static assets, and API routes
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
