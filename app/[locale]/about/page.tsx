import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'about' });
  return { title: t('title') };
}

export default function AboutPage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = useTranslations('about');

  return (
    <section className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>

      <h2 className="mt-10 text-xl font-semibold">{t('mission')}</h2>
      {/* Mission content — to be filled in */}
    </section>
  );
}
