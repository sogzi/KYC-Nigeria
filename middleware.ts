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
  const { pathname } = request.nextUrl;

  // Always inject the current pathname as a header so the admin layout can
  // read it via headers() and skip auth rendering for the login page.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // Login page is always accessible — no auth check, just pass through.
  if (pathname === '/admin/login') {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // For all other /admin/* routes — verify Supabase session.
  const response = NextResponse.next({ request: { headers: requestHeaders } });

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
            response.cookies.set(
              name, value,
              options as Parameters<typeof response.cookies.set>[2],
            ),
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

  // Admin routes → auth guard (no locale prefix)
  if (pathname.startsWith('/admin')) {
    return adminMiddleware(request);
  }

  // Safety guard: already-localized paths pass straight through.
  // Prevents next-intl from double-redirecting in Cloudflare Workers edge runtime.
  const firstSegment = pathname.split('/')[1];
  if (locales.includes(firstSegment as Locale)) {
    return NextResponse.next();
  }

  // Root and all other public paths → i18n middleware (redirects to /{locale}/…)
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
