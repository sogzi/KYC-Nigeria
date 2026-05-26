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
        defaultTheme="system"
        enableSystem
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

  return (
    <footer className="border-t bg-background py-8">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Know Your Candidate Nigeria</p>
        <p className="mt-1">
          {footer.tagline ?? 'Empowering informed voters across Nigeria.'}
        </p>
        <p className="mt-3">
          © {new Date().getFullYear()} Know Your Candidate Nigeria.{' '}
          {footer.rights ?? 'All rights reserved.'}
        </p>
      </div>
    </footer>
  );
}
