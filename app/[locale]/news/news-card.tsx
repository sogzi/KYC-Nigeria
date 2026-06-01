import { ExternalLink, Clock, User, Tag, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import type { NewsArticle } from '@/types';

interface Props {
  article: NewsArticle;
}

const SENTIMENT_CONFIG = {
  positive: {
    icon: TrendingUp,
    label: 'Positive',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  negative: {
    icon: TrendingDown,
    label: 'Negative',
    className: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  neutral: {
    icon: Minus,
    label: 'Neutral',
    className: 'bg-gray-50 text-gray-600 border-gray-200',
    dot: 'bg-gray-400',
  },
  mixed: {
    icon: Activity,
    label: 'Mixed',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
} as const;

const TAG_COLOURS: Record<string, string> = {
  economy:          'bg-blue-50 text-blue-700',
  security:         'bg-red-50 text-red-700',
  education:        'bg-purple-50 text-purple-700',
  health:           'bg-pink-50 text-pink-700',
  infrastructure:   'bg-orange-50 text-orange-700',
  corruption:       'bg-rose-50 text-rose-700',
  agriculture:      'bg-lime-50 text-lime-700',
  energy:           'bg-yellow-50 text-yellow-700',
  'foreign policy': 'bg-indigo-50 text-indigo-700',
  governance:       'bg-slate-50 text-slate-700',
  'election process':'bg-green-50 text-green-700',
  youth:            'bg-teal-50 text-teal-700',
  women:            'bg-fuchsia-50 text-fuchsia-700',
  environment:      'bg-emerald-50 text-emerald-700',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function NewsCard({ article: a }: Props) {
  const sentiment = a.sentiment as keyof typeof SENTIMENT_CONFIG | null;
  const sentCfg   = sentiment ? SENTIMENT_CONFIG[sentiment] : null;
  const SentIcon  = sentCfg?.icon;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">

      {/* Green accent bar */}
      <div className="h-1 w-full bg-brand-green" />

      <div className="flex flex-1 flex-col gap-3 p-5">

        {/* Source + date row */}
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wide">
            {a.source_name && (
              <span className="rounded bg-brand-green/10 px-2 py-0.5 text-brand-green">
                {a.source_name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            {formatDate(a.published_at)}
          </div>
        </div>

        {/* Title */}
        <h2 className="font-bold leading-snug text-gray-900 line-clamp-2 group-hover:text-brand-green transition-colors">
          {a.title}
        </h2>

        {/* AI summary (preferred) or description */}
        {(a.ai_summary || a.description) && (
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {a.ai_summary || a.description}
          </p>
        )}

        {/* Policy tags */}
        {a.policy_tags && a.policy_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {a.policy_tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${TAG_COLOURS[tag] ?? 'bg-secondary text-secondary-foreground'}`}
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Candidates mentioned */}
        {a.candidates_mentioned && a.candidates_mentioned.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <User className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">
              {a.candidates_mentioned.join(', ')}
            </span>
          </div>
        )}

        {/* Footer: sentiment + read more */}
        <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">

          {/* Sentiment badge */}
          {sentCfg && SentIcon ? (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${sentCfg.className}`}>
              <SentIcon className="h-2.5 w-2.5" />
              {sentCfg.label}
            </span>
          ) : (
            <span />
          )}

          {/* Read full article */}
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-green hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Read article
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </article>
  );
}
