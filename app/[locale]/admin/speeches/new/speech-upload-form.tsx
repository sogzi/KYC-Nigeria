'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useRef, useState } from 'react';
import {
  Upload, FileAudio, CheckCircle2, AlertCircle, Loader2, X, RefreshCw,
} from 'lucide-react';
import { Button }     from '@/components/ui/button';
import { cn }         from '@/lib/utils';
import {
  createSpeechWithUpload,
  retranscribeSpeech,
  type PipelineActionState,
} from '@/app/actions/speech-pipeline';
import type { CandidateCard } from '@/types';

// ── Submit button with pending state ─────────────────────────────────────────

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="gap-2 min-w-36">
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing…
        </>
      ) : (
        <>
          <Upload className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
}

// ── File drop-zone ────────────────────────────────────────────────────────────

function AudioDropZone({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onChange(dropped);
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(0)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        name="audio"
        id="audio"
        accept="audio/*,video/mp4,video/webm,video/quicktime"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />

      {file ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
          <FileAudio className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ''; }}
            className="rounded-md p-1 hover:bg-muted transition-colors"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-sm transition-colors',
            dragging
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/30',
          )}
        >
          <FileAudio className="h-8 w-8 opacity-60" />
          <span>
            <span className="font-medium text-foreground">Click to upload</span> or drag & drop
          </span>
          <span className="text-xs">MP3, MP4, WAV, WebM, M4A — max 25 MB</span>
        </button>
      )}
    </div>
  );
}

// ── Status banner ─────────────────────────────────────────────────────────────

function StatusBanner({ state }: { state: PipelineActionState }) {
  if (state.status === 'idle') return null;

  const isSuccess = state.status === 'success';
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
        isSuccess
          ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300'
          : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
      )}
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <div className="space-y-1">
        <p>{state.message}</p>
        {state.partialErrors && (
          <ul className="list-disc pl-4 text-xs">
            {Object.entries(state.partialErrors).map(([lang, err]) => (
              <li key={lang}>
                <span className="font-medium uppercase">{lang}</span>: {err}
              </li>
            ))}
          </ul>
        )}
        {isSuccess && state.speechId && (
          <p className="text-xs opacity-70">Speech ID: {state.speechId}</p>
        )}
      </div>
    </div>
  );
}

// ── Retranscribe form ─────────────────────────────────────────────────────────

function RetranscribeForm() {
  const [state, formAction] = useFormState(retranscribeSpeech, {
    status: 'idle' as const,
    message: '',
  });

  return (
    <form action={formAction} className="space-y-3">
      <h2 className="text-sm font-semibold">Re-run pipeline on existing speech</h2>
      <div className="flex gap-2">
        <input
          name="speechId"
          placeholder="Speech UUID"
          required
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
      <StatusBanner state={state} />
    </form>
  );
}

// ── Main upload form ──────────────────────────────────────────────────────────

interface Props {
  candidates: CandidateCard[];
}

const INITIAL_STATE: PipelineActionState = { status: 'idle', message: '' };

export function SpeechUploadForm({ candidates }: Props) {
  const [state, formAction] = useFormState(createSpeechWithUpload, INITIAL_STATE);
  const [file, setFile]     = useState<File | null>(null);
  const formRef             = useRef<HTMLFormElement>(null);

  // Reset form on success
  const handleSuccess = () => {
    formRef.current?.reset();
    setFile(null);
  };

  return (
    <div className="space-y-8">
      {/* ── Upload form ── */}
      <form ref={formRef} action={formAction} className="space-y-5">
        <StatusBanner state={state} />

        {state.status === 'success' && (
          <button
            type="button"
            onClick={handleSuccess}
            className="text-xs text-primary underline underline-offset-2"
          >
            Add another speech
          </button>
        )}

        {/* Candidate */}
        <div className="space-y-1.5">
          <label htmlFor="candidateId" className="text-sm font-medium">
            Candidate <span className="text-destructive">*</span>
          </label>
          <select
            id="candidateId"
            name="candidateId"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select a candidate…</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} — {c.party_affiliation}{c.state ? ` (${c.state})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-sm font-medium">
            Speech title <span className="text-destructive">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="e.g. Campaign rally speech — Kano, 2025"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Date + Source */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="date" className="text-sm font-medium">
              Date <span className="text-destructive">*</span>
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="source" className="text-sm font-medium">
              Source <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <input
              id="source"
              name="source"
              type="text"
              placeholder="e.g. Channels TV"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Video URL */}
        <div className="space-y-1.5">
          <label htmlFor="videoUrl" className="text-sm font-medium">
            YouTube / video URL{' '}
            <span className="text-muted-foreground text-xs">(optional)</span>
          </label>
          <input
            id="videoUrl"
            name="videoUrl"
            type="url"
            placeholder="https://youtube.com/watch?v=…"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label htmlFor="tags" className="text-sm font-medium">
            Tags{' '}
            <span className="text-muted-foreground text-xs">(comma-separated)</span>
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            placeholder="economy, security, healthcare"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Audio file */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Audio / video file{' '}
            <span className="text-muted-foreground text-xs">
              (optional — enables Whisper transcription + Claude translation)
            </span>
          </label>
          <AudioDropZone file={file} onChange={setFile} />
        </div>

        <div className="flex items-center justify-between gap-4 pt-1">
          <p className="text-xs text-muted-foreground">
            {file
              ? 'Audio will be transcribed by Whisper then translated by Claude into Hausa, Yoruba, and Igbo.'
              : 'Skip the file to create a speech entry manually — you can add the audio later.'}
          </p>
          <SubmitButton label={file ? 'Upload & Transcribe' : 'Create Speech'} />
        </div>
      </form>

      {/* ── Divider ── */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or retry an existing speech
          </span>
        </div>
      </div>

      {/* ── Retranscribe ── */}
      <RetranscribeForm />
    </div>
  );
}
