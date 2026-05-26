import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getCandidateProfile } from '@/lib/supabase/queries';
import { CandidateHero } from '@/components/candidates/candidate-hero';
import { CandidateTabs } from '@/components/candidates/candidate-tabs';
import { locales, type Locale } from '@/i18n/config';

// Revalidate profile pages every hour; fresh data without a full redeploy.
export const revalidate = 3600;

type Props = { params: { locale: string; id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await getCandidateProfile(params.id);
  if (!data) return { title: 'Candidate not found' };

  return {
    title: data.full_name,
    description: data.biography
      ? data.biography.slice(0, 160).replace(/\n/g, ' ')
      : `${data.full_name} — ${data.party_affiliation} ${data.election_type} candidate`,
    openGraph: {
      title: `${data.full_name} | Know Your Candidate Nigeria`,
      description: data.biography?.slice(0, 160) ?? undefined,
      images: data.photo_url ? [{ url: data.photo_url }] : [],
    },
  };
}

export default async function CandidateProfilePage({ params }: Props) {
  const locale = locales.includes(params.locale as Locale)
    ? (params.locale as Locale)
    : 'en';
  setRequestLocale(locale);

  const { data, error } = await getCandidateProfile(params.id);

  if (!data || error) notFound();

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-10 space-y-6">
      <CandidateHero candidate={data} />
      <CandidateTabs candidate={data} locale={locale} />
    </div>
  );
}
