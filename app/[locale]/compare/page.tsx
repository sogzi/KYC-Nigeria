import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'compare' });
  return { title: t('title') };
}

export default function ComparePage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = useTranslations('compare');

  return (
    <section className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>

      {/* Comparison panel — populated once data layer is wired up */}
      <div className="mt-8 rounded-lg border bg-card p-8 text-center text-muted-foreground">
        {t('selectPrompt')}
      </div>
    </section>
  );
}
