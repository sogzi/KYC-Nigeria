import { type NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient }  from '@supabase/ssr';
import { locales, defaultLocale, type Locale } from './i18n/config';

// ── i18n middleware (handles all non-admin public routes) ─────────────────────

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

// ── Admin auth guard ──────────────────────────────────────────────────────────

async function adminMiddleware(request: NextRequest): Promise<NextResponse> {
  // Login page is always accessible
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Create a mutable response so we can forward refreshed cookies
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]),
          );
        },
      },
    },
  );

  // getUser() verifies the JWT against Supabase — more secure than getSession()
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

// ── Combined middleware ───────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes → auth guard (no locale prefix)
  if (pathname.startsWith('/admin')) {
    return adminMiddleware(request);
  }

  // Safety guard: if the path already starts with a valid locale segment,
  // pass straight through — prevents next-intl from double-redirecting in
  // edge runtimes (e.g. Cloudflare Workers).
  const firstSegment = pathname.split('/')[1];
  if (locales.includes(firstSegment as Locale)) {
    return NextResponse.next();
  }

  // Root / and all other paths → i18n middleware (redirects to /{locale}/...)
  return intlMiddleware(request);
}

export const config = {
  // Match all routes except Next.js internals, static files, and API routes
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
