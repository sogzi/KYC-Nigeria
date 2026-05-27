import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Mic2, ShieldAlert } from 'lucide-react';
import { locales, type Locale } from '@/i18n/config';
import { getAllCandidatesLight } from '@/lib/supabase/queries';
import { SpeechUploadForm } from './speech-upload-form';

export const metadata: Metadata = {
  title: 'Upload Speech — Admin | KYC Nigeria',
  description: 'Admin: upload a candidate speech for AI transcription and translation.',
};

// Always dynamic — reads candidate list from DB on every request.
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminSpeechUploadPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : 'en';
  setRequestLocale(locale);

  const candidates = await getAllCandidatesLight();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Mic2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upload Candidate Speech</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Upload audio or video to auto-transcribe with Whisper and translate into
            Hausa, Yorùbá, and Igbo with Claude.
          </p>
        </div>
      </div>

      {/* ── Auth notice ── */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          <strong>Admin area.</strong> This page is not yet protected by authentication.
          Add a session check before deploying to production.
        </p>
      </div>

      {/* ── Pipeline info ── */}
      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        {[
          { step: '01', label: 'Upload', desc: 'Audio/video stored in Supabase Storage' },
          { step: '02', label: 'Transcribe', desc: 'OpenAI Whisper → English transcript' },
          { step: '03', label: 'Translate', desc: 'Claude → Hausa, Yorùbá, Igbo' },
        ].map(({ step, label, desc }) => (
          <div key={step} className="rounded-lg border bg-card p-3 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground">{step}</span>
            <p className="font-semibold">{label}</p>
            <p className="text-muted-foreground leading-snug">{desc}</p>
          </div>
        ))}
      </div>

      {/* ── Form ── */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <SpeechUploadForm candidates={candidates} />
      </div>
    </div>
  );
}
