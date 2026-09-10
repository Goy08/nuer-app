// ── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = "user" | "moderator" | "admin";

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  is_native_speaker: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  is_native_speaker?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ── Translate ─────────────────────────────────────────────────────────────────

export type LangCode = "eng_Latn" | "nus_Latn";

export interface TranslateRequest {
  text: string;
  source_lang: LangCode;
  target_lang: LangCode;
}

export interface TranslateResponse {
  source_text: string;
  translated_text: string;
  source_lang: string;
  target_lang: string;
  source: "dictionary" | "model";
  entry_id: string | null;
  entry_type: "word" | "phrase" | null;
}

// ── Dictionary ────────────────────────────────────────────────────────────────

export interface WordResponse {
  id: string;
  nuer_text: string;
  english_text: string;
  pronunciation: string | null;
  part_of_speech: string | null;
  category: string | null;
  audio_url: string | null;
  dialect: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface PhraseResponse {
  id: string;
  nuer_text: string;
  english_text: string;
  context: string | null;
  audio_url: string | null;
  category: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface DictionarySearchResponse {
  words: WordResponse[];
  phrases: PhraseResponse[];
  total: number;
}

// ── Lessons ───────────────────────────────────────────────────────────────────

export interface FlashCard {
  item_id: string;
  item_type: "word" | "phrase";
  nuer_text: string;
  english_text: string;
  audio_url: string | null;
  times_seen: number;
  times_correct: number;
  ease_factor: number;
  next_review: string;
}

export interface LessonResponse {
  category: string;
  cards: FlashCard[];
}

export interface ProgressUpdate {
  item_id: string;
  item_type: "word" | "phrase";
  quality: number; // 0-5 SM-2
}

export interface ProgressResponse {
  item_id: string;
  item_type: string;
  next_review: string;
  ease_factor: number;
  interval_days: number;
}

// ── Contributions ─────────────────────────────────────────────────────────────

export type ContributionType = "word" | "phrase" | "correction" | "audio";
export type ContributionStatus = "pending" | "approved" | "rejected";

export interface ContributionCreate {
  type: ContributionType;
  payload: Record<string, unknown>;
}

export interface ContributionReview {
  status: ContributionStatus;
  review_notes?: string | null;
}

export interface ContributionResponse {
  id: string;
  contributor_id: string;
  type: ContributionType;
  payload: Record<string, unknown>;
  status: ContributionStatus;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
}
