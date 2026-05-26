import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import Link from 'next/link';

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'home' });
  return { title: t('title') };
}

export default function HomePage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = useTranslations('home');

  return (
    <section className="container mx-auto flex flex-col items-center px-4 py-20 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
        {t('title')}
      </h1>
      <p className="mt-6 max-w-xl text-lg text-muted-foreground">
        {t('subtitle')}
      </p>
      <Link
        href={`/${locale}/candidates`}
        className="mt-10 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow transition-opacity hover:opacity-90"
      >
        {t('cta')}
      </Link>
    </section>
  );
}
