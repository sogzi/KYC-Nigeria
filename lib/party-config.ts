/** Party hex colours used for dynamic inline styles (avoids Tailwind purge issues). */
export const PARTY_COLOURS: Record<string, string> = {
  APC: '#0052CC',
  PDP: '#C0392B',
  Labour: '#C0392B',
  NNPP: '#00897B',
  APGA: '#D35400',
  ADC: '#E67E22',
  SDP: '#7B1FA2',
  YPP: '#1565C0',
  ZLP: '#2E7D32',
};

export function getPartyColour(party: string): string {
  return PARTY_COLOURS[party] ?? '#4B5563';
}

/** Tailwind classes for election type badge (complete strings — no interpolation). */
export const ELECTION_TYPE_BADGE: Record<string, string> = {
  presidential: 'bg-amber-100 text-amber-800 border border-amber-200',
  gubernatorial: 'bg-blue-100 text-blue-800 border border-blue-200',
  senatorial: 'bg-purple-100 text-purple-800 border border-purple-200',
  house_of_reps: 'bg-green-100 text-green-800 border border-green-200',
};

export const ELECTION_TYPE_LABEL: Record<string, string> = {
  presidential: 'Presidential',
  gubernatorial: 'Gubernatorial',
  senatorial: 'Senatorial',
  house_of_reps: 'House of Reps',
};

/** Track-record type configuration (complete Tailwind strings). */
export const RECORD_TYPE_CONFIG: Record<
  string,
  { dot: string; badge: string; border: string }
> = {
  achievement: {
    dot: 'bg-green-500',
    badge: 'bg-green-50 text-green-700 border border-green-200',
    border: 'border-l-green-500',
  },
  controversy: {
    dot: 'bg-red-400',
    badge: 'bg-red-50 text-red-700 border border-red-200',
    border: 'border-l-red-400',
  },
  conviction: {
    dot: 'bg-red-700',
    badge: 'bg-red-100 text-red-900 border border-red-300',
    border: 'border-l-red-700',
  },
  policy: {
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 border border-blue-200',
    border: 'border-l-blue-500',
  },
  appointment: {
    dot: 'bg-purple-500',
    badge: 'bg-purple-50 text-purple-700 border border-purple-200',
    border: 'border-l-purple-500',
  },
};

/** Fact-check verdict configuration (complete Tailwind strings). */
export const VERDICT_CONFIG: Record<
  string,
  { label: string; card: string; icon: string }
> = {
  true: {
    label: 'True',
    card: 'bg-green-50 border-green-200',
    icon: 'text-green-600',
  },
  false: {
    label: 'False',
    card: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
  },
  misleading: {
    label: 'Misleading',
    card: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-600',
  },
  unverified: {
    label: 'Unverified',
    card: 'bg-gray-50 border-gray-200',
    icon: 'text-gray-400',
  },
};

/** Manifesto category icons (lucide-react icon names) and labels. */
export const MANIFESTO_CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: string; colour: string }
> = {
  economy: { label: 'Economy', icon: 'TrendingUp', colour: 'text-emerald-600' },
  security: { label: 'Security', icon: 'Shield', colour: 'text-red-600' },
  education: { label: 'Education', icon: 'GraduationCap', colour: 'text-blue-600' },
  healthcare: { label: 'Healthcare', icon: 'Heart', colour: 'text-pink-600' },
  infrastructure: { label: 'Infrastructure', icon: 'Building2', colour: 'text-orange-600' },
  corruption: { label: 'Anti-Corruption', icon: 'Scale', colour: 'text-purple-600' },
};

/** Format a naira amount compactly: ₦2.4B, ₦500M, etc. */
export function formatNaira(amount: number | null): string {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}
