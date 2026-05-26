/**
 * Convenience re-exports.
 *
 * Import from here in application code:
 *   import type { Candidate, FactCheck } from '@/types'
 */

export type {
  Database,
  // Enum mirrors
  ElectionType,
  ManifestoCategory,
  TrackRecordType,
  FactCheckVerdict,
  // JSONB shapes
  EducationEntry,
  PropertyEntry,
  VehicleEntry,
  CashEntry,
  LiabilityEntry,
} from './database.types';

import type { Database } from './database.types';

// ── Utility: extract a table's Row / Insert / Update ─────────────────────────
type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T];

export type Row<T extends keyof Database['public']['Tables']> =
  Tables<T>['Row'];

export type Insert<T extends keyof Database['public']['Tables']> =
  Tables<T>['Insert'];

export type Update<T extends keyof Database['public']['Tables']> =
  Tables<T>['Update'];

// ── Named Row types (most common import) ─────────────────────────────────────
export type Candidate       = Row<'candidates'>;
export type Manifesto       = Row<'manifestos'>;
export type TrackRecord     = Row<'track_records'>;
export type AssetDeclaration = Row<'asset_declarations'>;
export type Speech          = Row<'speeches'>;
export type FactCheck       = Row<'fact_checks'>;

// ── Named Insert types (used when creating records) ──────────────────────────
export type CandidateInsert       = Insert<'candidates'>;
export type ManifestoInsert       = Insert<'manifestos'>;
export type TrackRecordInsert     = Insert<'track_records'>;
export type AssetDeclarationInsert = Insert<'asset_declarations'>;
export type SpeechInsert          = Insert<'speeches'>;
export type FactCheckInsert       = Insert<'fact_checks'>;

// ── Named Update types ───────────────────────────────────────────────────────
export type CandidateUpdate       = Update<'candidates'>;
export type ManifestoUpdate       = Update<'manifestos'>;
export type TrackRecordUpdate     = Update<'track_records'>;
export type AssetDeclarationUpdate = Update<'asset_declarations'>;
export type SpeechUpdate          = Update<'speeches'>;
export type FactCheckUpdate       = Update<'fact_checks'>;

// ── Enriched types (joins) ────────────────────────────────────────────────────

/** Candidate with all related records pre-fetched (for profile page) */
export type CandidateProfile = Candidate & {
  manifestos: Manifesto[];
  track_records: TrackRecord[];
  asset_declarations: AssetDeclaration[];
  speeches: Speech[];
  fact_checks: FactCheck[];
};

/** Candidate with only the fields needed for a card / list view */
export type CandidateCard = Pick<
  Candidate,
  | 'id'
  | 'full_name'
  | 'photo_url'
  | 'party_affiliation'
  | 'election_type'
  | 'state'
  | 'constituency'
  | 'current_position'
  | 'is_verified'
>;

/** Candidate pair for the Compare page */
export type ComparisonPair = {
  left: CandidateProfile;
  right: CandidateProfile;
};

// ── Nigeria-specific constants ────────────────────────────────────────────────

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti',
  'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
] as const;

export type NigerianState = (typeof NIGERIAN_STATES)[number];

export const MAJOR_PARTIES = [
  'APC',    // All Progressives Congress
  'PDP',    // Peoples Democratic Party
  'Labour', // Labour Party
  'NNPP',   // New Nigeria Peoples Party
  'APGA',   // All Progressives Grand Alliance
  'ADC',    // African Democratic Congress
  'SDP',    // Social Democratic Party
] as const;

export type MajorParty = (typeof MAJOR_PARTIES)[number];
