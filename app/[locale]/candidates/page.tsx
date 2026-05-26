import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'candidates' });
  return { title: t('title') };
}

export default function CandidatesPage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = useTranslations('candidates');

  return (
    <section className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>

      <div className="mt-6">
        <input
          type="search"
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-md border bg-background px-4 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring md:max-w-sm"
        />
      </div>

      {/* Candidate grid — populated once data layer is wired up */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" />
    </section>
  );
}
