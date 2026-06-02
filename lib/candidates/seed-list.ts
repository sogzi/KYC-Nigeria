/**
 * Curated seed list of confirmed / high-probability 2027 Nigerian candidates.
 *
 * Each entry maps directly to a Wikipedia page title so the pipeline can
 * fetch fresh, factual content automatically.  Keep this list updated as
 * more candidates declare.
 *
 * Wikipedia title format: use the exact article title as it appears in the URL
 * e.g. https://en.wikipedia.org/wiki/Bola_Tinubu → "Bola Tinubu"
 */

export type ElectionType =
  | 'presidential'
  | 'gubernatorial'
  | 'senatorial'
  | 'house_of_reps';

export interface SeedCandidate {
  /** Used for deduplication — lowercase slug */
  slug: string;
  full_name: string;
  wikipedia_title: string;
  party_affiliation: string;
  election_type: ElectionType;
  /** State of contest (null for presidential) */
  state: string | null;
  current_position: string;
}

export const SEED_CANDIDATES: SeedCandidate[] = [
  // ── Presidential ─────────────────────────────────────────────────────────────

  {
    slug: 'bola-tinubu',
    full_name: 'Bola Tinubu',
    wikipedia_title: 'Bola Tinubu',
    party_affiliation: 'APC',
    election_type: 'presidential',
    state: null,
    current_position: 'President of Nigeria',
  },
  {
    slug: 'atiku-abubakar',
    full_name: 'Atiku Abubakar',
    wikipedia_title: 'Atiku Abubakar',
    party_affiliation: 'PDP',
    election_type: 'presidential',
    state: null,
    current_position: 'Former Vice President of Nigeria',
  },
  {
    slug: 'peter-obi',
    full_name: 'Peter Obi',
    wikipedia_title: 'Peter Obi',
    party_affiliation: 'Labour Party',
    election_type: 'presidential',
    state: null,
    current_position: 'Former Governor of Anambra State',
  },
  {
    slug: 'rabiu-kwankwaso',
    full_name: 'Rabiu Kwankwaso',
    wikipedia_title: 'Rabiu Kwankwaso',
    party_affiliation: 'NNPP',
    election_type: 'presidential',
    state: null,
    current_position: 'Former Governor of Kano State',
  },
  {
    slug: 'nyesom-wike',
    full_name: 'Nyesom Wike',
    wikipedia_title: 'Nyesom Wike',
    party_affiliation: 'PDP',
    election_type: 'presidential',
    state: null,
    current_position: 'Minister of the Federal Capital Territory',
  },
  {
    slug: 'rotimi-amaechi',
    full_name: 'Rotimi Amaechi',
    wikipedia_title: 'Rotimi Amaechi',
    party_affiliation: 'APC',
    election_type: 'presidential',
    state: null,
    current_position: 'Former Minister of Transportation',
  },

  // ── Key Governors / Senate ────────────────────────────────────────────────────

  {
    slug: 'babajide-sanwo-olu',
    full_name: 'Babajide Sanwo-Olu',
    wikipedia_title: 'Babajide Sanwo-Olu',
    party_affiliation: 'APC',
    election_type: 'gubernatorial',
    state: 'Lagos',
    current_position: 'Governor of Lagos State',
  },
  {
    slug: 'seyi-makinde',
    full_name: 'Seyi Makinde',
    wikipedia_title: 'Seyi Makinde',
    party_affiliation: 'PDP',
    election_type: 'gubernatorial',
    state: 'Oyo',
    current_position: 'Governor of Oyo State',
  },
  {
    slug: 'charles-soludo',
    full_name: 'Charles Soludo',
    wikipedia_title: 'Chukwuma Soludo',
    party_affiliation: 'APGA',
    election_type: 'gubernatorial',
    state: 'Anambra',
    current_position: 'Governor of Anambra State',
  },
  {
    slug: 'dapo-abiodun',
    full_name: 'Dapo Abiodun',
    wikipedia_title: 'Dapo Abiodun',
    party_affiliation: 'APC',
    election_type: 'gubernatorial',
    state: 'Ogun',
    current_position: 'Governor of Ogun State',
  },
  {
    slug: 'godwin-obaseki',
    full_name: 'Godwin Obaseki',
    wikipedia_title: 'Godwin Obaseki',
    party_affiliation: 'PDP',
    election_type: 'gubernatorial',
    state: 'Edo',
    current_position: 'Former Governor of Edo State',
  },
  {
    slug: 'abdullahi-ganduje',
    full_name: 'Abdullahi Ganduje',
    wikipedia_title: 'Abdullahi Ganduje',
    party_affiliation: 'APC',
    election_type: 'gubernatorial',
    state: 'Kano',
    current_position: 'Former Governor of Kano State',
  },
  {
    slug: 'bukola-saraki',
    full_name: 'Bukola Saraki',
    wikipedia_title: 'Bukola Saraki',
    party_affiliation: 'PDP',
    election_type: 'senatorial',
    state: 'Kwara',
    current_position: 'Former Senate President of Nigeria',
  },
  {
    slug: 'kayode-fayemi',
    full_name: 'Kayode Fayemi',
    wikipedia_title: 'Kayode Fayemi',
    party_affiliation: 'APC',
    election_type: 'gubernatorial',
    state: 'Ekiti',
    current_position: 'Former Governor of Ekiti State',
  },
  {
    slug: 'simon-lalong',
    full_name: 'Simon Lalong',
    wikipedia_title: 'Simon Lalong',
    party_affiliation: 'APC',
    election_type: 'gubernatorial',
    state: 'Plateau',
    current_position: 'Former Governor of Plateau State',
  },
];
