import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, ExternalLink } from 'lucide-react';
import { VERDICT_CONFIG } from '@/lib/party-config';
import type { FactCheck, FactCheckVerdict } from '@/types';

interface Props {
  factChecks: FactCheck[];
}

const VERDICT_ICON: Record<FactCheckVerdict, React.ComponentType<{ className?: string }>> = {
  true:       CheckCircle2,
  false:      XCircle,
  misleading: AlertTriangle,
  unverified: HelpCircle,
};

const VERDICT_LABEL: Record<FactCheckVerdict, string> = {
  true:       'True',
  false:      'False',
  misleading: 'Misleading',
  unverified: 'Unverified',
};

/** Summary tally at the top. */
function VerdictSummary({ factChecks }: { factChecks: FactCheck[] }) {
  const counts = factChecks.reduce<Record<string, number>>((acc, fc) => {
    acc[fc.verdict] = (acc[fc.verdict] ?? 0) + 1;
    return acc;
  }, {});

  const items: { verdict: FactCheckVerdict; label: string; count: number }[] = [
    { verdict: 'true', label: 'True', count: counts['true'] ?? 0 },
    { verdict: 'false', label: 'False', count: counts['false'] ?? 0 },
    { verdict: 'misleading', label: 'Misleading', count: counts['misleading'] ?? 0 },
    { verdict: 'unverified', label: 'Unverified', count: counts['unverified'] ?? 0 },
  ];

  return (
    <div className="grid grid-cols-4 divide-x rounded-lg border overflow-hidden">
      {items.map(({ verdict, label, count }) => {
        const config = VERDICT_CONFIG[verdict];
        const Icon = VERDICT_ICON[verdict];
        return (
          <div
            key={verdict}
            className={`flex flex-col items-center py-3 px-2 text-center ${config.card}`}
          >
            <Icon className={`h-4 w-4 ${config.icon}`} />
            <span className="mt-0.5 text-lg font-bold">{count}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function FactCheckCard({ factCheck }: { factCheck: FactCheck }) {
  const config = VERDICT_CONFIG[factCheck.verdict] ?? VERDICT_CONFIG.unverified;
  const Icon = VERDICT_ICON[factCheck.verdict] ?? HelpCircle;
  const label = VERDICT_LABEL[factCheck.verdict] ?? factCheck.verdict;

  return (
    <div className={`rounded-lg border p-4 ${config.card}`}>
      {/* Verdict badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${config.card} ${config.icon} border`}>
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <div className="flex flex-col items-end gap-0.5">
          {factCheck.checked_by && (
            <span className="text-xs text-muted-foreground">
              Checked by {factCheck.checked_by}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(factCheck.checked_at).toLocaleDateString('en-NG', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Claim */}
      <div className="mb-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
          Claim
        </p>
        <p className="text-sm font-medium leading-snug">
          &ldquo;{factCheck.claim}&rdquo;
        </p>
      </div>

      {/* Explanation */}
      <p className="text-sm leading-relaxed text-muted-foreground">
        {factCheck.explanation}
      </p>

      {/* Source */}
      {factCheck.source_url && (
        <a
          href={factCheck.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-3 inline-flex items-center gap-1 text-xs hover:underline ${config.icon}`}
        >
          <ExternalLink className="h-3 w-3" />
          Read source
        </a>
      )}
    </div>
  );
}

export function FactChecksTab({ factChecks }: Props) {
  if (!factChecks.length) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        <p className="font-medium">No fact checks conducted yet.</p>
        <p className="mt-1">
          Our team checks public claims made by candidates.
          Check back as the election approaches.
        </p>
      </div>
    );
  }

  // Sort: false → misleading → unverified → true (most informative first)
  const ORDER: FactCheckVerdict[] = ['false', 'misleading', 'unverified', 'true'];
  const sorted = [...factChecks].sort(
    (a, b) => ORDER.indexOf(a.verdict) - ORDER.indexOf(b.verdict),
  );

  return (
    <div className="space-y-4">
      <VerdictSummary factChecks={factChecks} />
      {sorted.map((fc) => (
        <FactCheckCard key={fc.id} factCheck={fc} />
      ))}
    </div>
  );
}
