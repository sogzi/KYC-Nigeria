'use client';

import {
  BookOpen, ListChecks, TrendingUp, Mic2, PiggyBank, CheckSquare,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { OverviewTab } from './tabs/overview-tab';
import { ManifestoTab } from './tabs/manifesto-tab';
import { TrackRecordTab } from './tabs/track-record-tab';
import { SpeechesTab } from './tabs/speeches-tab';
import { AssetsTab } from './tabs/assets-tab';
import { FactChecksTab } from './tabs/fact-checks-tab';
import type { CandidateProfile } from '@/types';
import type { Locale } from '@/i18n/config';

interface Tab {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

interface Props {
  candidate: CandidateProfile;
  locale: Locale;
  className?: string;
}

export function CandidateTabs({ candidate, locale, className }: Props) {
  const tabs: Tab[] = [
    { value: 'overview',     label: 'Overview',        icon: BookOpen },
    { value: 'manifesto',    label: 'Manifesto',       icon: ListChecks, count: candidate.manifestos.length },
    { value: 'track-record', label: 'Track Record',    icon: TrendingUp, count: candidate.track_records.length },
    { value: 'speeches',     label: 'Speeches',        icon: Mic2,       count: candidate.speeches.length },
    { value: 'assets',       label: 'Asset Decl.',     icon: PiggyBank },
    { value: 'fact-checks',  label: 'Fact Checks',     icon: CheckSquare, count: candidate.fact_checks.length },
  ];

  return (
    <Tabs defaultValue="overview" className={cn('w-full', className)}>
      {/* ── Tab bar — horizontally scrollable on mobile ── */}
      <div className="overflow-x-auto rounded-t-lg border-b bg-card">
        <TabsList className="flex w-max min-w-full rounded-none bg-transparent p-0 h-auto">
          {tabs.map(({ value, label, icon: Icon, count }) => (
            <TabsTrigger
              key={value}
              value={value}
              className={cn(
                'flex min-w-0 shrink-0 items-center gap-1.5 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium',
                'text-muted-foreground transition-none',
                'data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none',
                'hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
              {count !== undefined && count > 0 && (
                <span className="ml-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold leading-none text-muted-foreground">
                  {count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* ── Tab panels ── */}
      <div className="rounded-b-lg border border-t-0 bg-card p-4 sm:p-6">
        <TabsContent value="overview" className="mt-0 focus-visible:ring-0">
          <OverviewTab candidate={candidate} />
        </TabsContent>

        <TabsContent value="manifesto" className="mt-0 focus-visible:ring-0">
          <ManifestoTab manifestos={candidate.manifestos} />
        </TabsContent>

        <TabsContent value="track-record" className="mt-0 focus-visible:ring-0">
          <TrackRecordTab trackRecords={candidate.track_records} />
        </TabsContent>

        <TabsContent value="speeches" className="mt-0 focus-visible:ring-0">
          <SpeechesTab
            speeches={candidate.speeches}
            currentLocale={locale}
          />
        </TabsContent>

        <TabsContent value="assets" className="mt-0 focus-visible:ring-0">
          <AssetsTab declarations={candidate.asset_declarations} />
        </TabsContent>

        <TabsContent value="fact-checks" className="mt-0 focus-visible:ring-0">
          <FactChecksTab factChecks={candidate.fact_checks} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
