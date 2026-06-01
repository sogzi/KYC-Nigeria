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

export type SourceCredibility = 'official' | 'news_outlet' | 'civil_society' | 'unverified';

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
          last_verified_at: string | null;
          last_verified_by: string | null;
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
          last_verified_at?: string | null;
          last_verified_by?: string | null;
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
          last_verified_at?: string | null;
          last_verified_by?: string | null;
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
          /** tsvector maintained by trigger (section_title + content). */
          search_vector: string | null;
          source_credibility: SourceCredibility;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          section_title: string;
          content: string;
          category: ManifestoCategory;
          created_at?: string;
          source_credibility?: SourceCredibility;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          section_title?: string;
          content?: string;
          category?: ManifestoCategory;
          created_at?: string;
          source_credibility?: SourceCredibility;
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
          source_credibility: SourceCredibility;
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
          source_credibility?: SourceCredibility;
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
          source_credibility?: SourceCredibility;
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
          /** tsvector maintained by trigger (title + transcript_en). */
          search_vector: string | null;
          /** Supabase Storage path for the uploaded audio/video file. */
          audio_storage_path: string | null;
          /** Pipeline status: none | processing | done | error */
          transcription_status: 'none' | 'processing' | 'done' | 'error';
          /** Last pipeline error message, if any. */
          transcription_error: string | null;
          /** True when content was AI-transcribed (Whisper) and/or AI-translated (Claude). */
          ai_translated: boolean;
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
          audio_storage_path?: string | null;
          transcription_status?: 'none' | 'processing' | 'done' | 'error';
          transcription_error?: string | null;
          ai_translated?: boolean;
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
          audio_storage_path?: string | null;
          transcription_status?: 'none' | 'processing' | 'done' | 'error';
          transcription_error?: string | null;
          ai_translated?: boolean;
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
          source_credibility: SourceCredibility;
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
          source_credibility?: SourceCredibility;
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
          source_credibility?: SourceCredibility;
        };
      };

      // ────────────────────────────────────────────────────────
      admin_profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          display_name: string | null;
          role: 'super_admin' | 'editor' | 'moderator';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          display_name?: string | null;
          role?: 'super_admin' | 'editor' | 'moderator';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string;
          display_name?: string | null;
          role?: 'super_admin' | 'editor' | 'moderator';
          created_at?: string;
        };
      };

      // ────────────────────────────────────────────────────────
      audit_log: {
        Row: {
          id: string;
          table_name: string;
          record_id: string;
          action: 'insert' | 'update' | 'delete';
          old_data: Record<string, unknown> | null;
          new_data: Record<string, unknown> | null;
          changed_fields: string[] | null;
          changed_by_id: string | null;
          changed_by_username: string | null;
          changed_at: string;
          ip_address: string | null;
        };
        Insert: {
          id?: string;
          table_name: string;
          record_id: string;
          action: 'insert' | 'update' | 'delete';
          old_data?: Record<string, unknown> | null;
          new_data?: Record<string, unknown> | null;
          changed_fields?: string[] | null;
          changed_by_id?: string | null;
          changed_by_username?: string | null;
          changed_at?: string;
          ip_address?: string | null;
        };
        Update: never; // audit log is immutable
      };

      // ────────────────────────────────────────────────────────
      transcript_corrections: {
        Row: {
          id: string;
          speech_id: string;
          locale: 'en' | 'ha' | 'yo' | 'ig';
          correction: string;
          email: string | null;
          status: 'pending' | 'applied' | 'rejected';
          submitted_at: string;
        };
        Insert: {
          id?: string;
          speech_id: string;
          locale: 'en' | 'ha' | 'yo' | 'ig';
          correction: string;
          email?: string | null;
          status?: 'pending' | 'applied' | 'rejected';
          submitted_at?: string;
        };
        Update: {
          id?: string;
          speech_id?: string;
          locale?: 'en' | 'ha' | 'yo' | 'ig';
          correction?: string;
          email?: string | null;
          status?: 'pending' | 'applied' | 'rejected';
          submitted_at?: string;
        };
      };

      // ────────────────────────────────────────────────────────
      news_articles: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          url: string;
          source_name: string | null;
          author: string | null;
          published_at: string | null;
          image_url: string | null;
          ai_summary: string | null;
          candidates_mentioned: string[];
          policy_tags: string[];
          sentiment: 'positive' | 'negative' | 'neutral' | 'mixed' | null;
          ai_enriched_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          description?: string | null;
          url: string;
          source_name?: string | null;
          author?: string | null;
          published_at?: string | null;
          image_url?: string | null;
          ai_summary?: string | null;
          candidates_mentioned?: string[];
          policy_tags?: string[];
          sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed' | null;
          ai_enriched_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          url?: string;
          source_name?: string | null;
          author?: string | null;
          published_at?: string | null;
          image_url?: string | null;
          ai_summary?: string | null;
          candidates_mentioned?: string[];
          policy_tags?: string[];
          sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed' | null;
          ai_enriched_at?: string | null;
          updated_at?: string;
        };
      };

      // ────────────────────────────────────────────────────────
      moderation_queue: {
        Row: {
          id: string;
          content_type: 'manifesto' | 'track_record' | 'speech' | 'candidate';
          content_id: string;
          reason: 'wrong_info' | 'missing_context' | 'outdated' | 'other';
          user_note: string | null;
          ip_hash: string | null;
          status: 'pending' | 'reviewed' | 'dismissed';
          reviewed_by: string | null;
          reviewer_note: string | null;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          content_type: 'manifesto' | 'track_record' | 'speech' | 'candidate';
          content_id: string;
          reason: 'wrong_info' | 'missing_context' | 'outdated' | 'other';
          user_note?: string | null;
          ip_hash?: string | null;
          status?: 'pending' | 'reviewed' | 'dismissed';
          reviewed_by?: string | null;
          reviewer_note?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          content_type?: 'manifesto' | 'track_record' | 'speech' | 'candidate';
          content_id?: string;
          reason?: 'wrong_info' | 'missing_context' | 'outdated' | 'other';
          user_note?: string | null;
          ip_hash?: string | null;
          status?: 'pending' | 'reviewed' | 'dismissed';
          reviewed_by?: string | null;
          reviewer_note?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
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
