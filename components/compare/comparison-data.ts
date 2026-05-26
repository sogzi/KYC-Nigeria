/**
 * Pure utility that transforms an array of CandidateProfile objects into a
 * structured list of ComparisonSection objects ready for rendering.
 *
 * No JSX — safe to import in Server Components and unit tests alike.
 */

import { formatNaira } from '@/lib/party-config';
import type {
  CandidateProfile,
  EducationEntry,
  LiabilityEntry,
  PropertyEntry,
  VehicleEntry,
  CashEntry,
} from '@/types';

// ── Public types ─────────────────────────────────────────────────────────────

export interface ComparisonCell {
  content: string;
  sub?: string;        // secondary line (institution name, year, etc.)
  raw?: number;        // numeric value for relative comparisons
  isEmpty: boolean;    // true = no data, render as "—"
}

export interface ComparisonRow {
  id: string;
  label: string;
  sublabel?: string;
  cells: ComparisonCell[];   // one per candidate, in order
  isDifferent: boolean;      // drives amber row highlight
}

export interface ComparisonSection {
  id: string;
  title: string;
  icon: string;              // lucide-react icon component name
  rows: ComparisonRow[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** True when the non-empty cell values are not all identical. */
function valuesAreDifferent(cells: ComparisonCell[]): boolean {
  const values = cells.map((c) => (c.isEmpty ? '__EMPTY__' : String(c.raw ?? c.content)));
  return new Set(values).size > 1;
}

/** Current year constant (computed once at module load). */
const CURRENT_YEAR = new Date().getFullYear();

// ── Section builders ──────────────────────────────────────────────────────────

// 1. Education ────────────────────────────────────────────────────────────────

const DEGREE_RANK = [
  'PhD', 'DPhil', 'Masters', 'MSc', 'MA', 'MBA', 'LLM',
  'LLB', 'BSc', 'BEng', 'BA', 'BTech', 'HND', 'OND', 'NCE', 'Diploma',
];

function rankDegree(degree: string): number {
  const idx = DEGREE_RANK.findIndex((d) =>
    degree.toUpperCase().includes(d.toUpperCase()),
  );
  return idx === -1 ? 999 : idx;
}

function highestEducation(profile: CandidateProfile): EducationEntry | null {
  if (!profile.education?.length) return null;
  return [...profile.education].sort(
    (a, b) => rankDegree(a.degree ?? '') - rankDegree(b.degree ?? ''),
  )[0];
}

function buildEducationSection(profiles: CandidateProfile[]): ComparisonSection {
  const top = profiles.map(highestEducation);

  const degreeCells: ComparisonCell[] = top.map((e) =>
    e
      ? { content: e.degree ?? '—', sub: e.field, isEmpty: false }
      : { content: '—', isEmpty: true },
  );

  const institutionCells: ComparisonCell[] = top.map((e) =>
    e
      ? {
          content: e.institution ?? '—',
          sub: e.year_end ? String(e.year_end) : e.year_start ? String(e.year_start) : undefined,
          isEmpty: !e.institution,
        }
      : { content: '—', isEmpty: true },
  );

  const countCells: ComparisonCell[] = profiles.map((p) => {
    const n = p.education?.length ?? 0;
    return n > 0
      ? { content: `${n} qualification${n !== 1 ? 's' : ''}`, raw: n, isEmpty: false }
      : { content: '—', isEmpty: true };
  });

  return {
    id: 'education',
    title: 'Education',
    icon: 'GraduationCap',
    rows: [
      { id: 'ed-degree',      label: 'Highest Degree',    cells: degreeCells,      isDifferent: valuesAreDifferent(degreeCells)      },
      { id: 'ed-institution', label: 'Institution',       cells: institutionCells, isDifferent: valuesAreDifferent(institutionCells) },
      { id: 'ed-count',       label: 'Total Qualifications', cells: countCells,   isDifferent: valuesAreDifferent(countCells)       },
    ],
  };
}

// 2. Public service ───────────────────────────────────────────────────────────

function buildServiceSection(profiles: CandidateProfile[]): ComparisonSection {
  const yearsCells: ComparisonCell[] = profiles.map((p) => {
    if (!p.track_records.length) return { content: '—', isEmpty: true };
    const earliest = Math.min(...p.track_records.map((r) => r.year));
    const yrs = CURRENT_YEAR - earliest;
    return { content: `${yrs} years`, sub: `Since ${earliest}`, raw: yrs, isEmpty: false };
  });

  const appointmentCells: ComparisonCell[] = profiles.map((p) => {
    const n = p.track_records.filter((r) => r.record_type === 'appointment').length;
    return n > 0
      ? { content: String(n), raw: n, isEmpty: false }
      : { content: '—', isEmpty: true };
  });

  const firstRoleCells: ComparisonCell[] = profiles.map((p) => {
    if (!p.track_records.length) return { content: '—', isEmpty: true };
    const earliest = p.track_records.reduce((a, b) => (a.year < b.year ? a : b));
    return { content: String(earliest.year), sub: earliest.title, isEmpty: false };
  });

  return {
    id: 'service',
    title: 'Public Service',
    icon: 'Landmark',
    rows: [
      { id: 'svc-years',       label: 'Years in Service',      cells: yearsCells,       isDifferent: valuesAreDifferent(yearsCells)       },
      { id: 'svc-appointments',label: 'Appointments / Terms',  cells: appointmentCells, isDifferent: valuesAreDifferent(appointmentCells) },
      { id: 'svc-first',       label: 'First Public Role',     cells: firstRoleCells,   isDifferent: false },
    ],
  };
}

// 3. Manifesto positions ──────────────────────────────────────────────────────

const MANIFESTO_TOPICS = [
  { key: 'economy',        label: 'Economy' },
  { key: 'security',       label: 'Security' },
  { key: 'education',      label: 'Education' },
  { key: 'healthcare',     label: 'Healthcare' },
  { key: 'infrastructure', label: 'Infrastructure' },
  { key: 'corruption',     label: 'Anti-Corruption' },
] as const;

function buildManifestoSection(profiles: CandidateProfile[]): ComparisonSection {
  const rows: ComparisonRow[] = MANIFESTO_TOPICS.map(({ key, label }) => {
    const cells: ComparisonCell[] = profiles.map((p) => {
      const section = p.manifestos.find((m) => m.category === key);
      if (!section) return { content: '—', isEmpty: true };
      return {
        content: section.section_title,
        sub: section.content.slice(0, 90) + (section.content.length > 90 ? '…' : ''),
        isEmpty: false,
      };
    });

    return {
      id: `manifesto-${key}`,
      label,
      cells,
      isDifferent: valuesAreDifferent(cells),
    };
  });

  return {
    id: 'manifesto',
    title: 'Manifesto Positions',
    icon: 'BookOpen',
    rows,
  };
}

// 4. Track record ─────────────────────────────────────────────────────────────

function buildTrackRecordSection(profiles: CandidateProfile[]): ComparisonSection {
  const achievementCells: ComparisonCell[] = profiles.map((p) => {
    const n = p.track_records.filter((r) => r.record_type === 'achievement').length;
    return n > 0 ? { content: String(n), raw: n, isEmpty: false } : { content: '0', raw: 0, isEmpty: false };
  });

  const controversyCells: ComparisonCell[] = profiles.map((p) => {
    const n = p.track_records.filter(
      (r) => r.record_type === 'controversy' || r.record_type === 'conviction',
    ).length;
    return { content: String(n), raw: n, isEmpty: false };
  });

  const policyCells: ComparisonCell[] = profiles.map((p) => {
    const n = p.track_records.filter((r) => r.record_type === 'policy').length;
    return n > 0 ? { content: String(n), raw: n, isEmpty: false } : { content: '0', raw: 0, isEmpty: false };
  });

  const ratioCells: ComparisonCell[] = profiles.map((p, i) => {
    const achievements = achievementCells[i].raw ?? 0;
    const controversies = controversyCells[i].raw ?? 0;
    const total = achievements + controversies;
    if (total === 0) return { content: '—', isEmpty: true };
    const pct = Math.round((achievements / total) * 100);
    return { content: `${pct}% positive`, raw: pct, sub: `${achievements}A · ${controversies}C`, isEmpty: false };
  });

  return {
    id: 'track-record',
    title: 'Track Record',
    icon: 'ListChecks',
    rows: [
      { id: 'tr-achievements',  label: 'Achievements',              cells: achievementCells,  isDifferent: valuesAreDifferent(achievementCells)  },
      { id: 'tr-controversies', label: 'Controversies / Convictions', cells: controversyCells, isDifferent: valuesAreDifferent(controversyCells) },
      { id: 'tr-policies',      label: 'Policy Entries',            cells: policyCells,       isDifferent: valuesAreDifferent(policyCells)       },
      { id: 'tr-ratio',         label: 'Positive Ratio',            cells: ratioCells,        isDifferent: valuesAreDifferent(ratioCells)        },
    ],
  };
}

// 5. Asset declaration ────────────────────────────────────────────────────────

function buildAssetsSection(profiles: CandidateProfile[]): ComparisonSection {
  const latest = profiles.map((p) =>
    p.asset_declarations.length
      ? p.asset_declarations.reduce((a, b) =>
          a.declaration_year >= b.declaration_year ? a : b,
        )
      : null,
  );

  const totalCells: ComparisonCell[] = latest.map((d) =>
    d?.total_assets_naira != null
      ? { content: formatNaira(d.total_assets_naira), raw: d.total_assets_naira, isEmpty: false }
      : { content: 'Not available', isEmpty: true },
  );

  const liabilitiesCells: ComparisonCell[] = latest.map((d) => {
    if (!d) return { content: '—', isEmpty: true };
    const total = ((d.liabilities ?? []) as LiabilityEntry[]).reduce(
      (s, l) => s + (l.amount_naira ?? 0),
      0,
    );
    return total > 0
      ? { content: formatNaira(total), raw: total, isEmpty: false }
      : { content: '₦0', raw: 0, isEmpty: false };
  });

  const yearCells: ComparisonCell[] = latest.map((d) =>
    d
      ? { content: String(d.declaration_year), raw: d.declaration_year, isEmpty: false }
      : { content: '—', isEmpty: true },
  );

  return {
    id: 'assets',
    title: 'Declared Assets',
    icon: 'PiggyBank',
    rows: [
      { id: 'asset-year',        label: 'Declaration Year', cells: yearCells,        isDifferent: false },
      { id: 'asset-total',       label: 'Total Assets',     cells: totalCells,       isDifferent: valuesAreDifferent(totalCells)       },
      { id: 'asset-liabilities', label: 'Liabilities',      cells: liabilitiesCells, isDifferent: valuesAreDifferent(liabilitiesCells) },
    ],
  };
}

// 6. Fact checks ──────────────────────────────────────────────────────────────

function buildFactChecksSection(profiles: CandidateProfile[]): ComparisonSection {
  const totalCells: ComparisonCell[] = profiles.map((p) => {
    const n = p.fact_checks.length;
    return n > 0 ? { content: String(n), raw: n, isEmpty: false } : { content: '0', raw: 0, isEmpty: false };
  });

  const trueCells: ComparisonCell[] = profiles.map((p) => {
    const n = p.fact_checks.length;
    if (n === 0) return { content: '—', isEmpty: true };
    const trueCount = p.fact_checks.filter((f) => f.verdict === 'true').length;
    const pct = Math.round((trueCount / n) * 100);
    return { content: `${trueCount} (${pct}%)`, raw: pct, sub: `of ${n} checked`, isEmpty: false };
  });

  const falseCells: ComparisonCell[] = profiles.map((p) => {
    const n = p.fact_checks.length;
    if (n === 0) return { content: '—', isEmpty: true };
    const falseCount = p.fact_checks.filter(
      (f) => f.verdict === 'false' || f.verdict === 'misleading',
    ).length;
    const pct = Math.round((falseCount / n) * 100);
    return { content: `${falseCount} (${pct}%)`, raw: pct, sub: 'false or misleading', isEmpty: false };
  });

  return {
    id: 'fact-checks',
    title: 'Fact Checks',
    icon: 'CheckSquare',
    rows: [
      { id: 'fc-total', label: 'Claims Checked',       cells: totalCells, isDifferent: valuesAreDifferent(totalCells) },
      { id: 'fc-true',  label: 'True Claims',          cells: trueCells,  isDifferent: valuesAreDifferent(trueCells)  },
      { id: 'fc-false', label: 'False / Misleading',   cells: falseCells, isDifferent: valuesAreDifferent(falseCells) },
    ],
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function buildComparisonSections(
  profiles: CandidateProfile[],
): ComparisonSection[] {
  return [
    buildEducationSection(profiles),
    buildServiceSection(profiles),
    buildManifestoSection(profiles),
    buildTrackRecordSection(profiles),
    buildAssetsSection(profiles),
    buildFactChecksSection(profiles),
  ];
}
