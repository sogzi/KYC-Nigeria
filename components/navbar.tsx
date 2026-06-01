'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Globe, Search } from 'lucide-react';
import { GlobalSearch } from './search/global-search';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const t = useTranslations('nav');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { href: `/${locale}`,            key: 'home' },
    { href: `/${locale}/candidates`, key: 'candidates' },
    { href: `/${locale}/compare`,    key: 'compare' },
    { href: `/${locale}/fact-checks`, key: 'factChecks' },
    { href: `/${locale}/speeches`,   key: 'speeches' },
    { href: `/${locale}/news`,       key: 'news' },
    { href: `/${locale}/about`,      key: 'about' },
  ] as const;

  const isActive = (href: string) =>
    href === `/${locale}` ? pathname === `/${locale}` : pathname.startsWith(href);

  const switchLocale = (next: Locale) => {
    const withoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/';
    router.push(`/${next}${withoutLocale}`);
    setLangOpen(false);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/98 backdrop-blur supports-[backdrop-filter]:bg-white/95 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">

        {/* ── Logo ── */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-1.5 select-none"
          onClick={() => setMobileOpen(false)}
        >
          {/* Circle logo mark */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green text-white font-black text-sm leading-none">
            N
          </div>
          <span className="text-[1.1rem] font-black tracking-tight">
            <span className="text-gray-900">Naija</span>
            <span className="text-brand-green">Vote</span>
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {navLinks.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                'hover:text-brand-green',
                isActive(href)
                  ? 'text-brand-green underline underline-offset-4 decoration-brand-green decoration-2'
                  : 'text-gray-600',
              )}
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-2">

          {/* Language picker */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex h-8 items-center gap-1 rounded-md px-2 text-sm font-medium text-gray-500 hover:text-brand-green transition-colors"
              aria-label="Select language"
              aria-expanded={langOpen}
            >
              <Globe className="h-4 w-4" />
            </button>

            {langOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-border bg-white shadow-lg">
                  {locales.map((l) => (
                    <button
                      key={l}
                      onClick={() => switchLocale(l)}
                      className={cn(
                        'block w-full px-4 py-2.5 text-left text-sm hover:bg-secondary transition-colors',
                        l === locale ? 'font-semibold text-brand-green' : 'text-gray-700',
                      )}
                    >
                      {localeNames[l]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Search — desktop: full trigger; mobile: icon */}
          <div className="hidden md:block">
            <GlobalSearch />
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:text-brand-green transition-colors md:hidden"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Search Candidates CTA — desktop */}
          <Link
            href={`/${locale}/candidates`}
            className="hidden md:inline-flex items-center gap-1.5 rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Search className="h-3.5 w-3.5" />
            {t('searchCandidates')}
          </Link>

          {/* Mobile hamburger */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:text-brand-green transition-colors lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile search bar ── */}
      {searchOpen && (
        <div className="border-t bg-white px-4 py-3 md:hidden">
          <GlobalSearch autoFocus />
        </div>
      )}

      {/* ── Mobile nav drawer ── */}
      {mobileOpen && (
        <nav className="border-t bg-white lg:hidden">
          <div className="container mx-auto flex flex-col px-4 py-2">
            {navLinks.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'rounded-md px-3 py-3 text-sm font-medium transition-colors',
                  'hover:text-brand-green hover:bg-secondary',
                  isActive(href)
                    ? 'text-brand-green font-semibold'
                    : 'text-gray-600',
                )}
              >
                {t(key)}
              </Link>
            ))}
            <div className="mt-2 border-t pt-2">
              <div className="flex items-center gap-2 flex-wrap">
                {locales.map((l) => (
                  <button
                    key={l}
                    onClick={() => switchLocale(l)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                      l === locale
                        ? 'bg-brand-green text-white'
                        : 'bg-secondary text-gray-600 hover:bg-muted',
                    )}
                  >
                    {localeNames[l]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
