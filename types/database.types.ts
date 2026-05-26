/**
 * Supabase Database type definition for Know Your Candidate Nigeria.
 *
 * Regenerate automatically once the project is linked:
 *   npx supabase gen types typescript --project-id <your-project-id> \
 *     --schema public > types/database.types.ts
 *
 * Until then this hand-written version is the source of truth.
 */

// ── JSONB shape interfaces ────────────────────────────────────────────────────

export interface EducationEntry {
  institution: string;
  degree: string;
  /** e.g. "Law", "Computer Science" */
  field?: string;
  year_start?: number;
  year_end?: number;
}

export interface PropertyEntry {
  description: string;
  /** State / city / area */
  location: string;
  estimated_value_naira?: number;
}

export interface VehicleEntry {
  make: string;
  model: string;
  year?: number;
  estimated_value_naira?: number;
}

export interface CashEntry {
  /** ISO 4217 currency code, e.g. "NGN", "USD" */
  currency: string;
  amount: number;
  institution?: string;
}

export interface LiabilityEntry {
  description: string;
  creditor: string;
  amount_naira: number;
}

// ── Enum mirror types ─────────────────────────────────────────────────────────

export type ElectionType =
  | 'presidential'
  | 'gubernatorial'
  | 'senatorial'
  | 'house_of_reps';

export type ManifestoCategory =
  | 'economy'
  | 'security'
  | 'education'
  | 'healthcare'
  | 'infrastructure'
  | 'corruption';

export type TrackRecordType =
  | 'achievement'
  | 'controversy'
  | 'conviction'
  | 'policy'
  | 'appointment';

/** String values, not JS booleans — 'true' | 'false' are valid enum literals */
export type FactCheckVerdict = 'true' | 'false' | 'misleading' | 'unverified';

// ── Full Supabase Database type ───────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      // ────────────────────────────────────────────────────────
      candidates: {
        Row: {
          id: string;
          full_name: string;
          photo_url: string | null;
          date_of_birth: string | null;     // ISO date string
          state_of_origin: string | null;
          local_government: string | null;
          party_affiliation: string;
          election_type: ElectionType;
          state: string | null;
          constituency: string | null;
          current_position: string | null;
          biography: string | null;
          education: EducationEntry[];
          is_verified: boolean;
          created_at: string;               // ISO timestamp string
          updated_at: string;
          search_vector: string | null;     // tsvector, maintained by trigger
        };
        Insert: {
          id?: string;
          full_name: string;
          photo_url?: string | null;
          date_of_birth?: string | null;
          state_of_origin?: string | null;
          local_government?: string | null;
          party_affiliation: string;
          election_type: ElectionType;
          state?: string | null;
          constituency?: string | null;
          current_position?: string | null;
          biography?: string | null;
          education?: EducationEntry[];
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
          // search_vector is trigger-managed — omit from Insert
        };
        Update: {
          id?: string;
          full_name?: string;
          photo_url?: string | null;
          date_of_birth?: string | null;
          state_of_origin?: string | null;
          local_government?: string | null;
          party_affiliation?: string;
          election_type?: ElectionType;
          state?: string | null;
          constituency?: string | null;
          current_position?: string | null;
          biography?: string | null;
          education?: EducationEntry[];
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
          // search_vector is trigger-managed — omit from Update
        };
      };

      // ────────────────────────────────────────────────────────
      manifestos: {
        Row: {
          id: string;
          candidate_id: string;
          section_title: string;
          content: string;
          category: ManifestoCategory;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          section_title: string;
          content: string;
          category: ManifestoCategory;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          section_title?: string;
          content?: string;
          category?: ManifestoCategory;
          created_at?: string;
        };
      };

      // ────────────────────────────────────────────────────────
      track_records: {
        Row: {
          id: string;
          candidate_id: string;
          year: number;
          title: string;
          description: string;
          source_url: string | null;
          record_type: TrackRecordType;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          year: number;
          title: string;
          description: string;
          source_url?: string | null;
          record_type: TrackRecordType;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          year?: number;
          title?: string;
          description?: string;
          source_url?: string | null;
          record_type?: TrackRecordType;
          created_at?: string;
        };
      };

      // ────────────────────────────────────────────────────────
      asset_declarations: {
        Row: {
          id: string;
          candidate_id: string;
          declaration_year: number;
          total_assets_naira: number | null;
          properties: PropertyEntry[];
          vehicles: VehicleEntry[];
          cash: CashEntry[];
          liabilities: LiabilityEntry[];
          source_url: string | null;
          verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          declaration_year: number;
          total_assets_naira?: number | null;
          properties?: PropertyEntry[];
          vehicles?: VehicleEntry[];
          cash?: CashEntry[];
          liabilities?: LiabilityEntry[];
          source_url?: string | null;
          verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          declaration_year?: number;
          total_assets_naira?: number | null;
          properties?: PropertyEntry[];
          vehicles?: VehicleEntry[];
          cash?: CashEntry[];
          liabilities?: LiabilityEntry[];
          source_url?: string | null;
          verified?: boolean;
          created_at?: string;
        };
      };

      // ────────────────────────────────────────────────────────
      speeches: {
        Row: {
          id: string;
          candidate_id: string;
          title: string;
          date: string;             // ISO date string
          video_url: string | null;
          transcript_en: string | null;
          transcript_ha: string | null;
          transcript_yo: string | null;
          transcript_ig: string | null;
          tags: string[];
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          title: string;
          date: string;
          video_url?: string | null;
          transcript_en?: string | null;
          transcript_ha?: string | null;
          transcript_yo?: string | null;
          transcript_ig?: string | null;
          tags?: string[];
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          title?: string;
          date?: string;
          video_url?: string | null;
          transcript_en?: string | null;
          transcript_ha?: string | null;
          transcript_yo?: string | null;
          transcript_ig?: string | null;
          tags?: string[];
          source?: string | null;
          created_at?: string;
        };
      };

      // ────────────────────────────────────────────────────────
      fact_checks: {
        Row: {
          id: string;
          candidate_id: string;
          claim: string;
          verdict: FactCheckVerdict;
          explanation: string;
          source_url: string | null;
          checked_by: string | null;
          checked_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          claim: string;
          verdict?: FactCheckVerdict;
          explanation: string;
          source_url?: string | null;
          checked_by?: string | null;
          checked_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          claim?: string;
          verdict?: FactCheckVerdict;
          explanation?: string;
          source_url?: string | null;
          checked_by?: string | null;
          checked_at?: string;
          created_at?: string;
        };
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;

    Enums: {
      election_type: ElectionType;
      manifesto_category: ManifestoCategory;
      track_record_type: TrackRecordType;
      fact_check_verdict: FactCheckVerdict;
    };

    CompositeTypes: Record<string, never>;
  };
};
