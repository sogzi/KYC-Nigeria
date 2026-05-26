/**
 * Speech transcription and translation pipeline.
 *
 * Step 1: OpenAI Whisper API  → English transcript
 * Step 2: Anthropic Claude    → Hausa, Yoruba, and Igbo translations (parallel)
 *
 * Both clients are instantiated on demand (no module-level singletons) so
 * missing env vars only throw when the function is actually called, making
 * test environments easier to configure.
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TranslationLocale = 'ha' | 'yo' | 'ig';

export interface TranslationLanguage {
  code: TranslationLocale;
  /** Full language name passed to Claude's system prompt. */
  name: string;
}

export interface PipelineResult {
  transcript_en: string;
  transcript_ha: string | null;
  transcript_yo: string | null;
  transcript_ig: string | null;
  /** Any partial failures keyed by locale code (pipeline still succeeds). */
  translationErrors: Partial<Record<TranslationLocale, string>>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LANGUAGES: TranslationLanguage[] = [
  { code: 'ha', name: 'Hausa' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'ig', name: 'Igbo' },
];

const TRANSLATION_SYSTEM_PROMPT = (language: string) =>
  `You are a professional Nigerian political translator. Translate the following speech transcript accurately into ${language}. Preserve the speaker's tone and intent. Flag any culturally sensitive phrases with [NOTE: ...]. Output only the translation.`;

// ── Step 1: Whisper transcription ─────────────────────────────────────────────

/**
 * Transcribe audio with OpenAI Whisper.
 *
 * @param buffer - Raw audio/video bytes (max 25 MB).
 * @param filename - Original filename with extension — Whisper uses the
 *                   extension to detect format (e.g. "speech.mp3", "talk.mp4").
 * @returns English transcript text.
 */
export async function transcribeWithWhisper(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set.');
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Uint8Array satisfies ArrayBufferView<ArrayBuffer> — avoids SharedArrayBuffer
  // type-mismatch that arises when passing a Buffer directly to File.
  const bytes = new Uint8Array(buffer);
  const file  = new File([bytes], filename);

  const response = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en', // hint the expected language for better accuracy
  });

  if (!response.text) {
    throw new Error('Whisper returned an empty transcript.');
  }

  return response.text;
}

// ── Step 2: Claude translation ────────────────────────────────────────────────

/**
 * Translate an English transcript into one target language using Claude.
 *
 * @param text     - English source text.
 * @param language - Full language name, e.g. "Hausa", "Yoruba", "Igbo".
 * @returns Translated text.
 */
export async function translateWithClaude(
  text: string,
  language: string,
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set.');
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    system: TRANSLATION_SYSTEM_PROMPT(language),
    messages: [{ role: 'user', content: text }],
  });

  const block = message.content[0];
  if (!block || block.type !== 'text') {
    throw new Error(`Claude returned an unexpected response type: ${block?.type ?? 'none'}`);
  }

  return block.text;
}

// ── Step 3: Full pipeline ─────────────────────────────────────────────────────

/**
 * Run the full translation pipeline on an already-transcribed English text.
 *
 * Translations run in parallel. A failure in one language is captured in
 * `translationErrors` without aborting the others.
 */
export async function runTranslationPipeline(
  englishTranscript: string,
): Promise<PipelineResult> {
  const translations: Partial<Record<TranslationLocale, string>> = {};
  const translationErrors: Partial<Record<TranslationLocale, string>> = {};

  await Promise.allSettled(
    LANGUAGES.map(async ({ code, name }) => {
      try {
        translations[code] = await translateWithClaude(englishTranscript, name);
      } catch (err) {
        translationErrors[code] =
          err instanceof Error ? err.message : 'Unknown translation error';
      }
    }),
  );

  return {
    transcript_en: englishTranscript,
    transcript_ha: translations.ha ?? null,
    transcript_yo: translations.yo ?? null,
    transcript_ig: translations.ig ?? null,
    translationErrors,
  };
}

/**
 * Full end-to-end pipeline: transcribe audio then translate.
 *
 * @param buffer   - Raw audio/video bytes.
 * @param filename - Original filename with extension.
 */
export async function runFullPipeline(
  buffer: Buffer,
  filename: string,
): Promise<PipelineResult> {
  const transcript_en = await transcribeWithWhisper(buffer, filename);
  return runTranslationPipeline(transcript_en);
}
