'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { writeAuditLog, diffFields } from '@/lib/audit';
import type { Insert, Update, Row } from '@/types';

export type AdminActionState = {
  status: 'idle' | 'success' | 'error';
  message: string;
  id?: string;
};

function getIp() {
  const h = headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? h.get('x-real-ip')
    ?? undefined;
}

// ── Create candidate ──────────────────────────────────────────────────────────

export async function createCandidate(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin   = await requireAdminUser();
  const supabase = createAdminClient();

  const payload: Insert<'candidates'> = {
    full_name:          (formData.get('full_name') as string).trim(),
    party_affiliation:  (formData.get('party_affiliation') as string).trim(),
    election_type:      formData.get('election_type') as Row<'candidates'>['election_type'],
    photo_url:          (formData.get('photo_url') as string)?.trim() || null,
    date_of_birth:      (formData.get('date_of_birth') as string) || null,
    state_of_origin:    (formData.get('state_of_origin') as string)?.trim() || null,
    local_government:   (formData.get('local_government') as string)?.trim() || null,
    state:              (formData.get('state') as string)?.trim() || null,
    constituency:       (formData.get('constituency') as string)?.trim() || null,
    current_position:   (formData.get('current_position') as string)?.trim() || null,
    biography:          (formData.get('biography') as string)?.trim() || null,
    is_verified:        formData.get('is_verified') === 'true',
    education:          [],
  };

  if (!payload.full_name || !payload.party_affiliation || !payload.election_type) {
    return { status: 'error', message: 'Name, party, and election type are required.' };
  }

  const { data: raw, error } = await supabase
    .from('candidates')
    .insert(payload as never)
    .select('id')
    .single();

  const created = raw as { id: string } | null;

  if (error || !created) {
    return { status: 'error', message: error?.message ?? 'Failed to create candidate.' };
  }

  await writeAuditLog({
    tableName: 'candidates', recordId: created.id, action: 'insert',
    newData: payload as Record<string, unknown>,
    changedById: admin.id, changedByUsername: admin.profile.username,
    ipAddress: getIp(),
  });

  revalidatePath('/admin/candidates');
  revalidatePath('/[locale]/candidates', 'page');

  return { status: 'success', message: 'Candidate created.', id: created.id };
}

// ── Update candidate ──────────────────────────────────────────────────────────

export async function updateCandidate(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin    = await requireAdminUser();
  const supabase  = createAdminClient();
  const id       = formData.get('id') as string;

  if (!id) return { status: 'error', message: 'Candidate ID is required.' };

  // Fetch current state for diff
  const { data: rawCurrent } = await supabase.from('candidates').select('*').eq('id', id).single();
  const current = rawCurrent as Row<'candidates'> | null;

  const update: Update<'candidates'> = {
    full_name:          (formData.get('full_name') as string)?.trim() || undefined,
    party_affiliation:  (formData.get('party_affiliation') as string)?.trim() || undefined,
    election_type:      (formData.get('election_type') as Row<'candidates'>['election_type']) || undefined,
    photo_url:          (formData.get('photo_url') as string)?.trim() || null,
    date_of_birth:      (formData.get('date_of_birth') as string) || null,
    state_of_origin:    (formData.get('state_of_origin') as string)?.trim() || null,
    local_government:   (formData.get('local_government') as string)?.trim() || null,
    state:              (formData.get('state') as string)?.trim() || null,
    constituency:       (formData.get('constituency') as string)?.trim() || null,
    current_position:   (formData.get('current_position') as string)?.trim() || null,
    biography:          (formData.get('biography') as string)?.trim() || null,
    is_verified:        formData.get('is_verified') === 'true',
    last_verified_at:   formData.get('is_verified') === 'true' ? new Date().toISOString() : undefined,
    last_verified_by:   formData.get('is_verified') === 'true' ? admin.profile.username : undefined,
  };

  const { error } = await supabase.from('candidates').update(update as never).eq('id', id);

  if (error) return { status: 'error', message: error.message };

  const changedFields = current
    ? diffFields(current as unknown as Record<string, unknown>, update as Record<string, unknown>)
    : undefined;

  await writeAuditLog({
    tableName: 'candidates', recordId: id, action: 'update',
    oldData: current as unknown as Record<string, unknown> ?? undefined,
    newData: update as Record<string, unknown>,
    changedFields,
    changedById: admin.id, changedByUsername: admin.profile.username,
    ipAddress: getIp(),
  });

  revalidatePath('/admin/candidates');
  revalidatePath(`/admin/candidates/${id}`);
  revalidatePath('/[locale]/candidates', 'page');
  revalidatePath(`/[locale]/candidates/${id}`, 'page');

  return { status: 'success', message: 'Candidate updated.' };
}

// ── Delete candidate ──────────────────────────────────────────────────────────

export async function deleteCandidate(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin    = await requireAdminUser();
  const supabase  = createAdminClient();
  const id       = formData.get('id') as string;

  if (!id) return { status: 'error', message: 'Candidate ID is required.' };

  // Fetch before delete for audit
  const { data: rawBefore } = await supabase.from('candidates').select('*').eq('id', id).single();
  const before = rawBefore as Row<'candidates'> | null;

  const { error } = await supabase.from('candidates').delete().eq('id', id);

  if (error) return { status: 'error', message: error.message };

  await writeAuditLog({
    tableName: 'candidates', recordId: id, action: 'delete',
    oldData: before as unknown as Record<string, unknown> ?? undefined,
    changedById: admin.id, changedByUsername: admin.profile.username,
    ipAddress: getIp(),
  });

  revalidatePath('/admin/candidates');
  revalidatePath('/[locale]/candidates', 'page');

  return { status: 'success', message: 'Candidate deleted.' };
}
