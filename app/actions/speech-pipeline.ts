'use server';

/**
 * Server actions for the speech transcription/translation pipeline.
 *
 * createSpeechWithUpload     — Upload audio, create DB record, run pipeline.
 * retranscribeSpeech         — Re-run pipeline on an existing speech.
 * submitTranscriptCorrection — Store a user-submitted transcript correction.
 */

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { runFullPipeline, runTranslationPipeline } from '@/lib/speech-pipeline';
import type { Insert, Update, Row } from '@/types';

// ── Shared state type ─────────────────────────────────────────────────────────

export type PipelineActionState = {
  status: 'idle' | 'success' | 'error';
  message: string;
  speechId?: string;
  partialErrors?: Record<string, string>;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const ALLOWED_EXTENSIONS = ['mp3', 'mp4', 'wav', 'webm', 'ogg', 'm4a', 'aac', 'mov'];

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

// ── Action 1: Create speech with optional audio upload + pipeline ─────────────

export async function createSpeechWithUpload(
  _prev: PipelineActionState,
  formData: FormData,
): Promise<PipelineActionState> {
  const supabase = createAdminClient();

  // ── Validate required fields ──────────────────────────────────────────────

  const candidateId = (formData.get('candidateId') as string | null)?.trim();
  const title       = (formData.get('title')       as string | null)?.trim();
  const date        = (formData.get('date')         as string | null)?.trim();

  if (!candidateId || !title || !date) {
    return { status: 'error', message: 'Candidate, title, and date are required.' };
  }

  const source   = (formData.get('source')   as string | null)?.trim() || null;
  const videoUrl = (formData.get('videoUrl') as string | null)?.trim() || null;
  const tagsRaw  = (formData.get('tags')     as string | null)?.trim() || '';
  const tags     = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];

  // ── Handle optional audio file ────────────────────────────────────────────

  const file    = formData.get('audio') as File | null;
  const hasFile = file && file.size > 0;

  let audioStoragePath: string | null = null;
  let audioBuffer: Buffer | null      = null;

  if (hasFile) {
    const ext = getFileExtension(file.name);

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        status: 'error',
        message: `Unsupported file type ".${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}.`,
      };
    }

    if (file.size > 25 * 1024 * 1024) {
      return {
        status: 'error',
        message: 'Audio file must be under 25 MB (OpenAI Whisper API limit).',
      };
    }

    audioBuffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `speeches/${candidateId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('speech-audio')
      .upload(storagePath, audioBuffer, {
        contentType: file.type || 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      return {
        status: 'error',
        message: `Storage upload failed: ${uploadError.message}`,
      };
    }

    audioStoragePath = storagePath;
  }

  // ── Insert speech record (typed payload avoids Supabase TS narrowing) ─────

  const insertPayload: Insert<'speeches'> = {
    candidate_id:         candidateId,
    title,
    date,
    source,
    video_url:            videoUrl,
    tags,
    audio_storage_path:   audioStoragePath,
    transcription_status: audioStoragePath ? 'processing' : 'none',
    ai_translated:        false,
  };

  const { data: rawSpeech, error: insertError } = await supabase
    .from('speeches')
    .insert(insertPayload as never)     // cast: supabase-ssr narrows to never without it
    .select('id')
    .single();

  const speech = rawSpeech as Pick<Row<'speeches'>, 'id'> | null;

  if (insertError || !speech) {
    if (audioStoragePath) {
      await supabase.storage.from('speech-audio').remove([audioStoragePath]);
    }
    return {
      status: 'error',
      message: `Failed to create speech record: ${insertError?.message ?? 'Unknown error'}`,
    };
  }

  // ── Run transcription + translation pipeline ──────────────────────────────

  if (audioBuffer && audioStoragePath) {
    try {
      const filename = audioStoragePath.split('/').pop()!;
      const result   = await runFullPipeline(audioBuffer, filename);
      const hasTranslationErrors = Object.keys(result.translationErrors).length > 0;

      const doneUpdate: Update<'speeches'> = {
        transcript_en:        result.transcript_en,
        transcript_ha:        result.transcript_ha,
        transcript_yo:        result.transcript_yo,
        transcript_ig:        result.transcript_ig,
        transcription_status: 'done',
        ai_translated:        true,
        transcription_error:  hasTranslationErrors
          ? JSON.stringify(result.translationErrors)
          : null,
      };

      await supabase
        .from('speeches')
        .update(doneUpdate as never)
        .eq('id', speech.id);

      revalidatePath(`/[locale]/candidates/${candidateId}`, 'page');

      return {
        status:        'success',
        message:       hasTranslationErrors
          ? 'Transcribed successfully. Some translations failed — retry from admin.'
          : 'Speech uploaded, transcribed, and translated into Hausa, Yorùbá, and Igbo.',
        speechId:      speech.id,
        partialErrors: hasTranslationErrors ? result.translationErrors : undefined,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Pipeline failed';

      const errUpdate: Update<'speeches'> = {
        transcription_status: 'error',
        transcription_error:  msg,
      };
      await supabase
        .from('speeches')
        .update(errUpdate as never)
        .eq('id', speech.id);

      return {
        status:   'error',
        message:  `Speech created but transcription failed: ${msg}. Retry from admin.`,
        speechId: speech.id,
      };
    }
  }

  // No audio — speech created without transcription
  revalidatePath(`/[locale]/candidates/${candidateId}`, 'page');
  return {
    status:   'success',
    message:  'Speech created. Upload a file later to enable AI transcription.',
    speechId: speech.id,
  };
}

// ── Action 2: Re-run pipeline on an existing speech ───────────────────────────

export async function retranscribeSpeech(
  _prev: PipelineActionState,
  formData: FormData,
): Promise<PipelineActionState> {
  const speechId = (formData.get('speechId') as string | null)?.trim();
  if (!speechId) return { status: 'error', message: 'Speech ID is required.' };

  const supabase = createAdminClient();

  const { data: rawSpeech, error: fetchError } = await supabase
    .from('speeches')
    .select('id, candidate_id, audio_storage_path, transcript_en')
    .eq('id', speechId)
    .single();

  type SpeechRow = Pick<
    Row<'speeches'>,
    'id' | 'candidate_id' | 'audio_storage_path' | 'transcript_en'
  >;
  const speech = rawSpeech as SpeechRow | null;

  if (fetchError || !speech) {
    return { status: 'error', message: 'Speech not found.' };
  }

  // ── Option A: Re-translate from existing English transcript ───────────────

  if (!speech.audio_storage_path && speech.transcript_en) {
    const processingUpdate: Update<'speeches'> = { transcription_status: 'processing' };
    await supabase
      .from('speeches')
      .update(processingUpdate as never)
      .eq('id', speechId);

    try {
      const result = await runTranslationPipeline(speech.transcript_en);

      const translUpdate: Update<'speeches'> = {
        transcript_ha:        result.transcript_ha,
        transcript_yo:        result.transcript_yo,
        transcript_ig:        result.transcript_ig,
        transcription_status: 'done',
        ai_translated:        true,
        transcription_error:  Object.keys(result.translationErrors).length
          ? JSON.stringify(result.translationErrors)
          : null,
      };
      await supabase
        .from('speeches')
        .update(translUpdate as never)
        .eq('id', speechId);

      revalidatePath(`/[locale]/candidates/${speech.candidate_id}`, 'page');
      return { status: 'success', message: 'Translations regenerated.', speechId };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Translation failed';
      const errU: Update<'speeches'> = { transcription_status: 'error', transcription_error: msg };
      await supabase.from('speeches').update(errU as never).eq('id', speechId);
      return { status: 'error', message: msg };
    }
  }

  // ── Option B: Full re-run from stored audio ───────────────────────────────

  if (!speech.audio_storage_path) {
    return {
      status:  'error',
      message: 'No audio file or English transcript found. Upload a file first.',
    };
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from('speech-audio')
    .download(speech.audio_storage_path);

  if (downloadError || !fileData) {
    return {
      status:  'error',
      message: `Failed to download audio: ${downloadError?.message ?? 'Unknown error'}`,
    };
  }

  const processingU: Update<'speeches'> = { transcription_status: 'processing' };
  await supabase.from('speeches').update(processingU as never).eq('id', speechId);

  try {
    const audioBuffer = Buffer.from(await fileData.arrayBuffer());
    const filename    = speech.audio_storage_path.split('/').pop()!;
    const result      = await runFullPipeline(audioBuffer, filename);

    const doneU: Update<'speeches'> = {
      transcript_en:        result.transcript_en,
      transcript_ha:        result.transcript_ha,
      transcript_yo:        result.transcript_yo,
      transcript_ig:        result.transcript_ig,
      transcription_status: 'done',
      ai_translated:        true,
      transcription_error:  Object.keys(result.translationErrors).length
        ? JSON.stringify(result.translationErrors)
        : null,
    };
    await supabase.from('speeches').update(doneU as never).eq('id', speechId);

    revalidatePath(`/[locale]/candidates/${speech.candidate_id}`, 'page');
    return {
      status:   'success',
      message:  'Speech re-transcribed and translated successfully.',
      speechId,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Pipeline failed';
    const errU: Update<'speeches'> = { transcription_status: 'error', transcription_error: msg };
    await supabase.from('speeches').update(errU as never).eq('id', speechId);
    return { status: 'error', message: msg };
  }
}

// ── Action 3: Submit a transcript correction ──────────────────────────────────

export type CorrectionState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

export async function submitTranscriptCorrection(
  _prev: CorrectionState,
  formData: FormData,
): Promise<CorrectionState> {
  const speechId   = (formData.get('speechId')   as string | null)?.trim();
  const locale     = (formData.get('locale')     as string | null)?.trim();
  const correction = (formData.get('correction') as string | null)?.trim();
  const email      = (formData.get('email')      as string | null)?.trim() || null;

  if (!speechId || !locale || !correction) {
    return {
      status:  'error',
      message: 'Speech ID, language, and correction text are required.',
    };
  }

  if (correction.length < 10) {
    return { status: 'error', message: 'Correction must be at least 10 characters.' };
  }

  const VALID_LOCALES = ['en', 'ha', 'yo', 'ig'] as const;
  type SupportedLocale = (typeof VALID_LOCALES)[number];

  if (!(VALID_LOCALES as readonly string[]).includes(locale)) {
    return { status: 'error', message: 'Invalid locale. Must be one of: en, ha, yo, ig.' };
  }

  const supabase = createAdminClient();

  const insertPayload: Insert<'transcript_corrections'> = {
    speech_id:  speechId,
    locale:     locale as SupportedLocale,
    correction,
    email:      email || null,
  };

  const { error } = await supabase
    .from('transcript_corrections')
    .insert(insertPayload as never);

  if (error) {
    return { status: 'error', message: `Failed to save correction: ${error.message}` };
  }

  return {
    status:  'success',
    message: 'Thank you! Your correction has been submitted for review.',
  };
}
