import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, ArrowRight, CheckCircle2, BarChart3, Users, Globe2, ShieldCheck } from 'lucide-react';
import { getFilteredCandidates } from '@/lib/supabase/queries';
import { getPartyColour } from '@/lib/party-config';
import type { CandidateListItem } from '@/types';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'NaijaVote — Know Who You\'re Voting For',
    description: "Research candidates, compare manifestos, check track records and make an informed vote for Nigeria's 2027 General Elections.",
  };
}

// ── Election countdown (Feb 28, 2027) ────────────────────────────────────────

function getCountdown() {
  const election = new Date('2027-02-27T08:00:00+01:00').getTime();
  const now      = new Date('2026-05-27').getTime(); // pinned to today's date
  const diff     = Math.max(0, election - now);
  const days     = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours    = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins     = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs     = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, mins, secs };
}

// ── Stat items ────────────────────────────────────────────────────────────────

const STATS = [
  { value: '247',   label: 'Candidates Profiled' },
  { value: '36',    label: 'States Covered' },
  { value: '18',    label: 'Registered Parties' },
  { value: '1,240', label: 'Fact Checks Done' },
  { value: '4',     label: 'Languages Supported' },
  { value: '84k',   label: 'Voters Reached' },
];

// ── Preview avatars for hero ──────────────────────────────────────────────────

const PREVIEW_CANDIDATES = [
  { initials: 'AO', name: 'A. Okonkwo', party: 'APC',  colour: '#006400' },
  { initials: 'BJ', name: 'B. Johnson', party: 'PDP',  colour: '#C0392B' },
  { initials: 'CE', name: 'C. Eze',     party: 'LP',   colour: '#2E7D32' },
  { initials: 'DM', name: 'D. Musa',    party: 'NNPP', colour: '#5C3566' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-black/30 px-3 py-2 min-w-[56px]">
      <span className="text-2xl font-black text-white tabular-nums leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/70">
        {label}
      </span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { days, hours, mins, secs } = getCountdown();

  // Fetch presidential candidates for the preview section
  const allCandidates = await getFilteredCandidates({ election_type: 'presidential' });
  const previewCandidates = allCandidates.slice(0, 4);

  return (
    <div className="flex flex-col">

      {/* ══════════════════════════════════════════════════════
          HERO — dark green
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-brand-green px-4 pb-16 pt-10">
        {/* Subtle texture overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.04),transparent_60%)]" />

        <div className="container relative mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">

            {/* ── Left: text + CTA ── */}
            <div className="flex-1">
              {/* Badge */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
                Nigeria General Elections 2027
              </div>

              {/* Heading */}
              <h1 className="text-5xl font-black leading-[1.05] text-white sm:text-6xl lg:text-7xl">
                Know Who<br />
                You&apos;re{' '}
                <span className="text-brand-gold">Voting</span>
                <br />
                For.
              </h1>

              {/* Subtitle */}
              <p className="mt-5 max-w-md text-base leading-relaxed text-white/75">
                Research candidates, compare manifestos, check track records and make an informed vote.
                Your vote is your power.
              </p>

              {/* CTAs */}
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={`/${locale}/candidates`}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-brand-gold-light hover:shadow-xl"
                >
                  <Search className="h-4 w-4" />
                  Explore Candidates
                </Link>
                <Link
                  href={`/${locale}/compare`}
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-white/30 px-5 py-3 text-sm font-bold text-white transition-all hover:border-white/60 hover:bg-white/10"
                >
                  Compare Candidates
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Countdown */}
              <div className="mt-8">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/50">
                  <span className="h-1 w-3 rounded-full bg-brand-gold" />
                  Time Until Election Day
                </p>
                <div className="flex gap-2">
                  <CountdownBox value={days}  label="Days"  />
                  <CountdownBox value={hours} label="Hours" />
                  <CountdownBox value={mins}  label="Mins"  />
                  <CountdownBox value={secs}  label="Secs"  />
                </div>
              </div>
            </div>

            {/* ── Right: floating candidate previews ── */}
            <div className="hidden lg:flex lg:shrink-0 lg:gap-4">
              {PREVIEW_CANDIDATES.map((c) => (
                <div key={c.initials} className="flex flex-col items-center gap-2">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-black text-white shadow-xl ring-3 ring-white/20"
                    style={{ backgroundColor: c.colour }}
                  >
                    {c.initials}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-white/90">{c.name}</p>
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
                      style={{ backgroundColor: c.colour + 'cc' }}
                    >
                      {c.party}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════════════ */}
      <section className="border-b bg-white">
        <div className="container mx-auto max-w-6xl px-4 py-5">
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-black text-brand-green sm:text-2xl">{value}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PRESIDENTIAL CANDIDATES
      ══════════════════════════════════════════════════════ */}
      <section className="bg-brand-bg px-4 py-12">
        <div className="container mx-auto max-w-5xl">
          {/* Section header */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                Presidential <span className="text-brand-green">Candidates</span>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                All registered candidates for the 2027 Presidential Election
              </p>
            </div>
            <Link
              href={`/${locale}/candidates?election_type=presidential`}
              className="shrink-0 whitespace-nowrap rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-shadow hover:shadow-md"
            >
              View All {allCandidates.length > 0 ? allCandidates.length : 12} Candidates →
            </Link>
          </div>

          {/* Candidate list */}
          <div className="space-y-3">
            {previewCandidates.length > 0 ? (
              previewCandidates.map((c) => (
                <HomeCandidateCard key={c.id} candidate={c} locale={locale} />
              ))
            ) : (
              /* Skeleton / placeholder when DB is empty */
              PREVIEW_CANDIDATES.map((c) => (
                <HomeCandidatePlaceholder key={c.initials} {...c} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          COMPARE CTA SECTION
      ══════════════════════════════════════════════════════ */}
      <section className="bg-brand-green px-4 py-14">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center">

            {/* Left: text */}
            <div className="flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/70">
                + Feature
              </div>
              <h2 className="text-3xl font-black text-white sm:text-4xl">
                Compare<br />
                <span className="text-brand-gold">Side by Side</span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
                Select any two or three candidates and see where they stand on the issues that matter
                most to you — economy, security, healthcare, education and more.
              </p>
              <Link
                href={`/${locale}/compare`}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-gold px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-brand-gold-light"
              >
                Start Comparing →
              </Link>
            </div>

            {/* Right: mini comparison preview widget */}
            <div className="w-full max-w-xs shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/8 shadow-xl lg:max-w-sm">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-white ring-2 ring-white/20">AO</div>
                  <span className="text-xs font-semibold text-white">Okonkwo</span>
                </div>
                <span className="text-xs font-bold text-brand-gold">VS</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">Johnson</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-700 text-xs font-bold text-white ring-2 ring-white/20">BJ</div>
                </div>
              </div>
              {[
                { label: 'ECONOMY',    a: 78, b: 55 },
                { label: 'SECURITY',   a: 68, b: 82 },
                { label: 'EDUCATION',  a: 45, b: 70 },
                { label: 'HEALTHCARE', a: 60, b: 55 },
              ].map(({ label, a, b }) => (
                <div key={label} className="px-4 py-2">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">{label}</p>
                  <div className="flex gap-1.5">
                    <div className="flex-1 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-brand-gold" style={{ width: `${a}%` }} />
                    </div>
                    <div className="flex-1 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-green-400" style={{ width: `${b}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 border-t border-white/10 px-4 py-2.5">
                <span className="flex items-center gap-1 text-[10px] text-white/50">
                  <span className="inline-block h-2 w-2 rounded-full bg-brand-gold" />Okonkwo (APC)
                </span>
                <span className="flex items-center gap-1 text-[10px] text-white/50">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-400" />Johnson (PDP)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHY NAIJVOTE STRIP
      ══════════════════════════════════════════════════════ */}
      <section className="bg-brand-bg px-4 py-12">
        <div className="container mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-2xl font-black">
            Why Use <span className="text-brand-green">NaijaVote</span>?
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: 'Verified Information',
                desc: 'Every candidate profile is researched from official INEC filings, government websites and verified news sources.',
              },
              {
                icon: BarChart3,
                title: 'Fact-Checked Claims',
                desc: 'Our team rates political claims as True, Misleading, False or Unverified so you can cut through the noise.',
              },
              {
                icon: Globe2,
                title: '4 Nigerian Languages',
                desc: 'Content available in English, Hausa, Yorùbá and Igbo so every voter can access information in their language.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-green/10">
                  <Icon className="h-5 w-5 text-brand-green" />
                </div>
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

// ── Candidate cards for homepage ──────────────────────────────────────────────

function HomeCandidateCard({ candidate: c, locale }: { candidate: CandidateListItem; locale: string }) {
  const colour = getPartyColour(c.party_affiliation);

  // Derive manifesto-style tag chips from the candidate (using party/election as fallback tags)
  const tags = [c.election_type.replace('_', ' ')].filter(Boolean).slice(0, 3);

  return (
    <Link
      href={`/${locale}/candidates/${c.id}`}
      className="group flex items-start overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Party colour bar — left side */}
      <div className="h-full w-1.5 shrink-0 rounded-l-xl" style={{ backgroundColor: colour }} />

      {/* Avatar — offset up */}
      <div
        className="mx-4 mt-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-black text-white shadow-md ring-2 ring-white"
        style={{ backgroundColor: colour }}
      >
        {c.full_name.split(' ').slice(0, 2).map((n) => n[0]).join('')}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1 py-4 pr-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold leading-snug">{c.full_name}</p>
            {c.current_position && (
              <p className="text-xs text-muted-foreground">{c.current_position}</p>
            )}
          </div>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: colour }}
          >
            {c.party_affiliation}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-0.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold capitalize text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer row */}
        <div className="mt-1 flex items-center justify-between text-[11px]">
          <span className={c.is_verified ? 'flex items-center gap-1 text-brand-green font-semibold' : 'flex items-center gap-1 text-muted-foreground'}>
            <CheckCircle2 className="h-3 w-3" />
            {c.is_verified ? 'Verified Profile' : 'Unverified'}
          </span>
          <span className={c.has_assets ? 'text-muted-foreground' : 'text-amber-600 font-medium'}>
            {c.has_assets ? 'Assets Declared' : 'No Declaration'}
          </span>
        </div>
      </div>
    </Link>
  );
}

function HomeCandidatePlaceholder({
  initials, name, party, colour,
}: { initials: string; name: string; party: string; colour: string }) {
  return (
    <div className="flex items-start overflow-hidden rounded-xl border bg-white shadow-sm opacity-60">
      <div className="h-full w-1.5 shrink-0 rounded-l-xl" style={{ backgroundColor: colour }} />
      <div
        className="mx-4 mt-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-black text-white shadow-md ring-2 ring-white"
        style={{ backgroundColor: colour }}
      >
        {initials}
      </div>
      <div className="flex flex-1 flex-col gap-1 py-4 pr-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold">{name}</p>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: colour }}
          >
            {party}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Add candidates to see real profiles</p>
      </div>
    </div>
  );
}
