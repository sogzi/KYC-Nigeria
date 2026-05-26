'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Globe, Flag } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const t = useTranslations('nav');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { href: `/${locale}`, key: 'home' },
    { href: `/${locale}/candidates`, key: 'candidates' },
    { href: `/${locale}/compare`, key: 'compare' },
    { href: `/${locale}/about`, key: 'about' },
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">

        {/* ── Logo ── */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 font-bold"
          onClick={() => setMobileOpen(false)}
        >
          <Flag className="h-5 w-5 text-green-600" fill="currentColor" />
          <span className="text-green-700 dark:text-green-400">KYC</span>
          <span className="hidden text-sm font-medium text-muted-foreground sm:block">
            Nigeria
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive(href) && 'bg-accent text-accent-foreground',
              )}
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-1">

          {/* Language picker */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Select language"
              aria-expanded={langOpen}
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{localeNames[locale]}</span>
            </button>

            {langOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setLangOpen(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[130px] overflow-hidden rounded-md border bg-popover shadow-md">
                  {locales.map((l) => (
                    <button
                      key={l}
                      onClick={() => switchLocale(l)}
                      className={cn(
                        'block w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                        l === locale && 'font-semibold text-primary',
                      )}
                    >
                      {localeNames[l]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <ThemeToggle />

          {/* Mobile hamburger */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile nav drawer ── */}
      {mobileOpen && (
        <nav className="border-t bg-background md:hidden">
          <div className="container mx-auto flex flex-col px-4 py-2">
            {navLinks.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'rounded-md px-3 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive(href) && 'bg-accent text-accent-foreground',
                )}
              >
                {t(key)}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
