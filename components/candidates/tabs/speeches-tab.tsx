'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, PlayCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Speech } from '@/types';

type TranscriptLocale = 'en' | 'ha' | 'yo' | 'ig';

const LOCALE_LABELS: Record<TranscriptLocale, string> = {
  en: 'English',
  ha: 'Hausa',
  yo: 'Yorùbá',
  ig: 'Igbo',
};

interface Props {
  speeches: Speech[];
  currentLocale: string;
}

/** Extract YouTube video ID from various YouTube URL formats. */
function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v');
    }
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1).split('?')[0];
    }
  } catch {
    // not a valid URL
  }
  return null;
}

function SpeechCard({
  speech,
  defaultLocale,
}: {
  speech: Speech;
  defaultLocale: TranscriptLocale;
}) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptLocale, setTranscriptLocale] =
    useState<TranscriptLocale>(defaultLocale);

  const transcriptKey = `transcript_${transcriptLocale}` as
    | 'transcript_en'
    | 'transcript_ha'
    | 'transcript_yo'
    | 'transcript_ig';
  const transcript = speech[transcriptKey];

  // Which locales have content?
  const availableLocales = (
    ['en', 'ha', 'yo', 'ig'] as TranscriptLocale[]
  ).filter((l) => {
    const key = `transcript_${l}` as typeof transcriptKey;
    return !!speech[key];
  });

  const youtubeId = speech.video_url ? getYouTubeId(speech.video_url) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="space-y-1">
          <h3 className="font-semibold leading-snug">{speech.title}</h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              {new Date(speech.date).toLocaleDateString('en-NG', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            {speech.source && <span>· {speech.source}</span>}
            {speech.tags.length > 0 && (
              <span>
                ·{' '}
                {speech.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-block rounded-full bg-secondary px-2 py-0.5 mr-1 text-secondary-foreground"
                  >
                    {t}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Video embed */}
        {youtubeId ? (
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={speech.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        ) : speech.video_url ? (
          <a
            href={speech.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted transition-colors"
          >
            <PlayCircle className="h-5 w-5 text-primary" />
            Watch video
            <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
          </a>
        ) : null}

        {/* Transcript section */}
        {availableLocales.length > 0 && (
          <div>
            <button
              onClick={() => setShowTranscript((v) => !v)}
              className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Read transcript
              {showTranscript ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showTranscript && (
              <div className="mt-3 space-y-3">
                {/* Language switcher */}
                {availableLocales.length > 1 && (
                  <div className="flex gap-1 flex-wrap">
                    {availableLocales.map((l) => (
                      <button
                        key={l}
                        onClick={() => setTranscriptLocale(l)}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                          transcriptLocale === l
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                        )}
                      >
                        {LOCALE_LABELS[l]}
                      </button>
                    ))}
                  </div>
                )}

                {/* Transcript content */}
                {transcript ? (
                  <div className="rounded-md bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto">
                    {transcript}
                  </div>
                ) : (
                  <p className="text-xs italic text-muted-foreground">
                    No transcript available in {LOCALE_LABELS[transcriptLocale]}.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SpeechesTab({ speeches, currentLocale }: Props) {
  const defaultLocale =
    (['en', 'ha', 'yo', 'ig'] as TranscriptLocale[]).includes(
      currentLocale as TranscriptLocale,
    )
      ? (currentLocale as TranscriptLocale)
      : 'en';

  if (!speeches.length) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        <p className="font-medium">No speeches recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {speeches.map((speech) => (
        <SpeechCard
          key={speech.id}
          speech={speech}
          defaultLocale={defaultLocale}
        />
      ))}
    </div>
  );
}
