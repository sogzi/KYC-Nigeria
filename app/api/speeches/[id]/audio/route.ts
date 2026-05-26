/**
 * GET /api/speeches/[id]/audio
 *
 * Generates a short-lived signed URL for the speech audio file stored in
 * Supabase Storage and redirects the browser to it.
 *
 * Why a redirect instead of proxying?
 * – Signed URLs expire in 60 s (enough for a browser to start buffering).
 * – No streaming overhead on the Next.js server.
 * – The browser's native <audio> element handles range requests against the
 *   Supabase CDN URL directly.
 */

import { NextResponse }     from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { Row }          from '@/types';

const SIGNED_URL_EXPIRY_SECONDS = 60; // 1 minute — enough for the player to start

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Speech ID is required.' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch just the path field — avoids pulling the full record.
  const { data: rawSpeech, error: fetchError } = await supabase
    .from('speeches')
    .select('audio_storage_path')
    .eq('id', id)
    .single();

  // Cast: supabase-ssr narrows select results to never without explicit cast.
  const speech = rawSpeech as Pick<Row<'speeches'>, 'audio_storage_path'> | null;

  if (fetchError || !speech) {
    return NextResponse.json({ error: 'Speech not found.' }, { status: 404 });
  }

  if (!speech.audio_storage_path) {
    return NextResponse.json(
      { error: 'This speech has no uploaded audio file.' },
      { status: 404 },
    );
  }

  const { data: signed, error: signError } = await supabase.storage
    .from('speech-audio')
    .createSignedUrl(speech.audio_storage_path, SIGNED_URL_EXPIRY_SECONDS);

  if (signError || !signed?.signedUrl) {
    console.error('[audio route] Failed to create signed URL:', signError?.message);
    return NextResponse.json(
      { error: 'Could not generate audio URL. Please try again.' },
      { status: 500 },
    );
  }

  // Redirect → browser fetches audio directly from Supabase CDN.
  return NextResponse.redirect(signed.signedUrl, { status: 302 });
}
