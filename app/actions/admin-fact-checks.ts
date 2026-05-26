'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { writeAuditLog, diffFields } from '@/lib/audit';
import type { Insert, Update, Row } from '@/types';

export type FactCheckActionState = {
  status: 'idle' | 'success' | 'error';
  message: string;
  id?: string;
};

type FactCheckVerdict = Row<'fact_checks'>['verdict'];
type SourceCredibility = Row<'fact_checks'>['source_credibility'];

function getIp() {
  const h = headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined;
}

// ── Create fact-check ─────────────────────────────────────────────────────────

export async function createFactCheck(
  _prev: FactCheckActionState,
  formData: FormData,
): Promise<FactCheckActionState> {
  const admin    = await requireAdminUser();
  const supabase  = createAdminClient();

  const candidateId = formData.get('candidate_id') as string;
  const claim       = (formData.get('claim') as string)?.trim();
  const explanation = (formData.get('explanation') as string)?.trim();

  if (!candidateId || !claim || !explanation) {
    return { status: 'error', message: 'Candidate, claim, and explanation are required.' };
  }

  const payload: Insert<'fact_checks'> = {
    candidate_id:       candidateId,
    claim,
    verdict:            (formData.get('verdict') as FactCheckVerdict) || 'unverified',
    explanation,
    source_url:         (formData.get('source_url') as string)?.trim() || null,
    checked_by:         admin.profile.username,
    source_credibility: (formData.get('source_credibility') as SourceCredibility) || 'unverified',
  };

  const { data: raw, error } = await supabase
    .from('fact_checks')
    .insert(payload as never)
    .select('id')
    .single();

  const created = raw as { id: string } | null;

  if (error || !created) {
    return { status: 'error', message: error?.message ?? 'Failed to create fact-check.' };
  }

  await writeAuditLog({
    tableName: 'fact_checks', recordId: created.id, action: 'insert',
    newData: payload as Record<string, unknown>,
    changedById: admin.id, changedByUsername: admin.profile.username,
    ipAddress: getIp(),
  });

  revalidatePath('/admin/fact-checks');
  revalidatePath(`/[locale]/candidates/${candidateId}`, 'page');

  return { status: 'success', message: 'Fact-check created.', id: created.id };
}

// ── Update fact-check ─────────────────────────────────────────────────────────

export async function updateFactCheck(
  _prev: FactCheckActionState,
  formData: FormData,
): Promise<FactCheckActionState> {
  const admin    = await requireAdminUser();
  const supabase  = createAdminClient();
  const id       = formData.get('id') as string;

  if (!id) return { status: 'error', message: 'Fact-check ID is required.' };

  const { data: rawCurrent } = await supabase.from('fact_checks').select('*').eq('id', id).single();
  const current = rawCurrent as Row<'fact_checks'> | null;

  const update: Update<'fact_checks'> = {
    claim:              (formData.get('claim') as string)?.trim() || undefined,
    verdict:            (formData.get('verdict') as FactCheckVerdict) || undefined,
    explanation:        (formData.get('explanation') as string)?.trim() || undefined,
    source_url:         (formData.get('source_url') as string)?.trim() || null,
    checked_by:         admin.profile.username,
    source_credibility: (formData.get('source_credibility') as SourceCredibility) || undefined,
  };

  const { error } = await supabase.from('fact_checks').update(update as never).eq('id', id);

  if (error) return { status: 'error', message: error.message };

  const changedFields = current
    ? diffFields(current as unknown as Record<string, unknown>, update as Record<string, unknown>)
    : undefined;

  await writeAuditLog({
    tableName: 'fact_checks', recordId: id, action: 'update',
    oldData: current as unknown as Record<string, unknown> ?? undefined,
    newData: update as Record<string, unknown>,
    changedFields,
    changedById: admin.id, changedByUsername: admin.profile.username,
    ipAddress: getIp(),
  });

  if (current?.candidate_id) {
    revalidatePath(`/[locale]/candidates/${current.candidate_id}`, 'page');
  }
  revalidatePath('/admin/fact-checks');

  return { status: 'success', message: 'Fact-check updated.' };
}

// ── Delete fact-check ─────────────────────────────────────────────────────────

export async function deleteFactCheck(
  _prev: FactCheckActionState,
  formData: FormData,
): Promise<FactCheckActionState> {
  const admin    = await requireAdminUser();
  const supabase  = createAdminClient();
  const id       = formData.get('id') as string;

  if (!id) return { status: 'error', message: 'Fact-check ID is required.' };

  const { data: rawBefore } = await supabase.from('fact_checks').select('*').eq('id', id).single();
  const before = rawBefore as Row<'fact_checks'> | null;

  const { error } = await supabase.from('fact_checks').delete().eq('id', id);

  if (error) return { status: 'error', message: error.message };

  await writeAuditLog({
    tableName: 'fact_checks', recordId: id, action: 'delete',
    oldData: before as unknown as Record<string, unknown> ?? undefined,
    changedById: admin.id, changedByUsername: admin.profile.username,
    ipAddress: getIp(),
  });

  if (before?.candidate_id) {
    revalidatePath(`/[locale]/candidates/${before.candidate_id}`, 'page');
  }
  revalidatePath('/admin/fact-checks');

  return { status: 'success', message: 'Fact-check deleted.' };
}
