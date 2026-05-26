'use server';

/**
 * Flag a piece of content as potentially incorrect.
 * Writes a row to the moderation_queue table for admin review.
 */

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { Insert, Row } from '@/types';

export type FlagState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

/** Simple non-cryptographic hash for IP anonymisation. */
function hashIp(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // convert to 32-bit int
  }
  return Math.abs(hash).toString(16);
}

export async function flagContent(
  _prev: FlagState,
  formData: FormData,
): Promise<FlagState> {
  const content_type = formData.get('content_type') as string | null;
  const content_id   = formData.get('content_id')   as string | null;
  const reason       = formData.get('reason')       as string | null;
  const user_note    = (formData.get('user_note') as string | null)?.trim() || null;

  // Validate
  const validTypes   = ['manifesto', 'track_record', 'speech', 'candidate'] as const;
  const validReasons = ['wrong_info', 'missing_context', 'outdated', 'other'] as const;

  type ContentType = typeof validTypes[number];
  type Reason      = typeof validReasons[number];

  if (!content_type || !validTypes.includes(content_type as ContentType)) {
    return { status: 'error', message: 'Invalid content type.' };
  }
  if (!content_id || !/^[0-9a-f-]{36}$/i.test(content_id)) {
    return { status: 'error', message: 'Invalid content ID.' };
  }
  if (!reason || !validReasons.includes(reason as Reason)) {
    return { status: 'error', message: 'Please select a reason.' };
  }

  // Get and hash IP for spam prevention
  const headersList = headers();
  const rawIp =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    'unknown';
  const ip_hash = hashIp(rawIp);

  // Insert using anon client (RLS allows public INSERT on moderation_queue)
  const supabase = createClient();

  const payload: Insert<'moderation_queue'> = {
    content_type: content_type as ContentType,
    content_id,
    reason:       reason as Reason,
    user_note,
    ip_hash,
    status: 'pending',
  };

  const { error } = await supabase
    .from('moderation_queue')
    .insert(payload as never);

  if (error) {
    console.error('[flagContent] Insert failed:', error.message);
    return {
      status:  'error',
      message: 'Could not submit your report. Please try again.',
    };
  }

  return {
    status:  'success',
    message: 'Thank you — your report has been submitted for review.',
  };
}

// ── Admin queries (service role) ──────────────────────────────────────────────

export async function getModerationQueue(
  status: Row<'moderation_queue'>['status'] = 'pending',
) {
  const { createAdminClient } = await import('@/lib/supabase/server');
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('moderation_queue')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data ?? []) as Row<'moderation_queue'>[];
}

export async function updateFlagStatus(
  id: string,
  status: 'reviewed' | 'dismissed',
  reviewer_note?: string,
): Promise<void> {
  const { createAdminClient } = await import('@/lib/supabase/server');
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('moderation_queue')
    .update({
      status,
      reviewer_note: reviewer_note ?? null,
      reviewed_at: new Date().toISOString(),
    } as never)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Server action variant of updateFlagStatus — usable with useActionState.
 * Reads `id` and `status` from FormData.
 */
export async function updateFlagStatusAction(
  _prev: FlagState,
  formData: FormData,
): Promise<FlagState> {
  const id     = formData.get('id')     as string | null;
  const status = formData.get('status') as 'reviewed' | 'dismissed' | null;

  if (!id || !status) return { status: 'error', message: 'Missing id or status.' };

  try {
    await updateFlagStatus(id, status);
    return { status: 'success', message: 'Flag status updated.' };
  } catch (err) {
    return { status: 'error', message: (err as Error).message };
  }
}
