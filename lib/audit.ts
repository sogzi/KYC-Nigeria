/**
 * Audit log helper.
 *
 * Call writeAuditLog() from every server action that mutates candidate data.
 * Uses the service-role admin client so it always succeeds regardless of RLS.
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { Insert } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuditAction = 'insert' | 'update' | 'delete';

export interface AuditEvent {
  tableName:  string;
  recordId:   string;
  action:     AuditAction;
  oldData?:   Record<string, unknown>;
  newData?:   Record<string, unknown>;
  /** Only pass keys that actually changed (for update events). */
  changedFields?: string[];
  changedById?:   string;
  changedByUsername?: string;
  ipAddress?: string;
}

// ── Helper: compute changed fields ───────────────────────────────────────────

export function diffFields(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
): string[] {
  return Object.keys(newData).filter((key) => {
    return JSON.stringify(oldData[key]) !== JSON.stringify(newData[key]);
  });
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function writeAuditLog(event: AuditEvent): Promise<void> {
  const supabase = createAdminClient();

  const payload: Insert<'audit_log'> = {
    table_name:          event.tableName,
    record_id:           event.recordId,
    action:              event.action,
    old_data:            event.oldData ?? null,
    new_data:            event.newData ?? null,
    changed_fields:      event.changedFields ?? null,
    changed_by_id:       event.changedById   ?? null,
    changed_by_username: event.changedByUsername ?? null,
    ip_address:          event.ipAddress ?? null,
  };

  const { error } = await supabase
    .from('audit_log')
    .insert(payload as never);

  if (error) {
    // Audit failures should never block the main operation — log only.
    console.error('[audit] Failed to write audit log:', error.message, event);
  }
}
