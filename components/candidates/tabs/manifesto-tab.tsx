import {
  TrendingUp, Shield, GraduationCap, Heart, Building2, Scale,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MANIFESTO_CATEGORY_CONFIG } from '@/lib/party-config';
import type { Manifesto, ManifestoCategory } from '@/types';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  economy:        TrendingUp,
  security:       Shield,
  education:      GraduationCap,
  healthcare:     Heart,
  infrastructure: Building2,
  corruption:     Scale,
};

interface Props {
  manifestos: Manifesto[];
}

export function ManifestoTab({ manifestos }: Props) {
  if (!manifestos.length) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        <p className="font-medium">No manifesto sections available yet.</p>
        <p className="mt-1">
          Check back after the candidate submits their official manifesto.
        </p>
      </div>
    );
  }

  // Group by category in the declared order of MANIFESTO_CATEGORY_CONFIG
  const grouped = Object.keys(MANIFESTO_CATEGORY_CONFIG).reduce<
    Record<string, Manifesto[]>
  >((acc, cat) => {
    acc[cat] = manifestos.filter((m) => m.category === cat);
    return acc;
  }, {});

  // Include any unknown categories at the end
  const knownCategories = new Set(Object.keys(MANIFESTO_CATEGORY_CONFIG));
  const otherSections = manifestos.filter(
    (m) => !knownCategories.has(m.category),
  );

  return (
    <div className="space-y-6">
      {Object.entries(grouped)
        .filter(([, sections]) => sections.length > 0)
        .map(([category, sections]) => {
          const config = MANIFESTO_CATEGORY_CONFIG[category];
          const Icon = CATEGORY_ICONS[category] ?? Scale;

          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${config.colour}`} />
                  {config.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sections.map((section) => (
                  <div key={section.id} className="space-y-1.5">
                    <h4 className="font-semibold text-sm">{section.section_title}</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {section.content}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

      {/* Orphan sections */}
      {otherSections.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Other</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {otherSections.map((section) => (
              <div key={section.id} className="space-y-1.5">
                <h4 className="font-semibold text-sm">{section.section_title}</h4>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {section.content}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
