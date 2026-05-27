import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';
import { ThemeProvider } from '@/components/theme-provider';
import { Navbar } from '@/components/navbar';

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export async function generateMetadata({
  params: { locale },
}: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'home' });
  return { title: t('title') };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: Props) {
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering for all locale routes
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer messages={messages} />
        </div>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}

function Footer({ messages }: { messages: Record<string, unknown> }) {
  const footer = (messages as { footer?: { rights?: string; tagline?: string } })
    .footer ?? {};

  const links = [
    { label: 'About',             href: '/en/about' },
    { label: 'Data Sources',      href: '/en/about#data' },
    { label: 'Submit Correction', href: '/en/about#correction' },
    { label: 'Contact',           href: '/en/about#contact' },
    { label: 'Privacy',           href: '/en/about#privacy' },
  ];

  return (
    <footer className="bg-brand-green">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand-green font-black text-sm">N</div>
              <span className="text-lg font-black text-white">
                Naija<span className="text-brand-gold">Vote</span>
              </span>
            </div>
            <p className="mt-2 text-xs text-white/60 max-w-xs">
              {footer.tagline ?? 'Empowering Nigerians with knowledge. Non-partisan civic platform.'}
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-5 gap-y-1">
            {links.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} NaijaVote Nigeria.{' '}
            {footer.rights ?? 'All rights reserved.'}
          </p>
          <p className="text-xs font-semibold text-white/50">
            🏆 Built for Nigeria&apos;s Democracy
          </p>
        </div>
      </div>
    </footer>
  );
}
