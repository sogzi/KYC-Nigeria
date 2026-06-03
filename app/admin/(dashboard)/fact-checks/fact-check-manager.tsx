'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  createFactCheck,
  updateFactCheck,
  deleteFactCheck,
  type FactCheckActionState,
} from '@/app/actions/admin-fact-checks';
import { DataTable } from '@/components/ui/data-table';
import { ConfirmationDialog } from '@/components/admin/confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ColumnDef } from '@tanstack/react-table';
import type { Row } from '@/types';
import {
  Plus, Pencil, Trash2, CheckCircle, AlertCircle, X,
} from 'lucide-react';

type FactCheck = Row<'fact_checks'>;
type Candidate = Pick<Row<'candidates'>, 'id' | 'full_name' | 'party_affiliation'>;

// ── Verdict badge ─────────────────────────────────────────────────────────────

const VERDICT_STYLES: Record<string, string> = {
  true:         'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400',
  false:        'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
  misleading:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400',
  unverified:   'bg-muted text-muted-foreground',
};

function VerdictBadge({ verdict }: { verdict: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${VERDICT_STYLES[verdict] ?? VERDICT_STYLES.unverified}`}>
      {verdict}
    </span>
  );
}

// ── Submit button ─────────────────────────────────────────────────────────────

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Saving…' : label}
    </Button>
  );
}

// ── Fact-check form (create / edit) ───────────────────────────────────────────

const initial: FactCheckActionState = { status: 'idle', message: '' };

function FactCheckForm({
  candidates,
  editing,
  onClose,
}: {
  candidates: Candidate[];
  editing?: FactCheck;
  onClose: () => void;
}) {
  const isEditing = !!editing;
  const action    = isEditing ? updateFactCheck : createFactCheck;
  const [state, formAction] = useFormState(action, initial);

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{isEditing ? 'Edit fact-check' : 'New fact-check'}</h2>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {state.status !== 'idle' && (
        <div
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm border ${
            state.status === 'success'
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          {state.status === 'success'
            ? <CheckCircle className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />}
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-3">
        {isEditing && <input type="hidden" name="id" value={editing.id} />}

        {/* Candidate */}
        {!isEditing && (
          <div className="space-y-1">
            <label className="text-sm font-medium">Candidate <span className="text-destructive">*</span></label>
            <select
              name="candidate_id"
              required
              defaultValue=""
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm
                         shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select candidate…</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.party_affiliation})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Claim */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Claim <span className="text-destructive">*</span></label>
          <Input name="claim" defaultValue={editing?.claim ?? ''} placeholder="The claim to fact-check…" required />
        </div>

        {/* Verdict + Source credibility */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Verdict <span className="text-destructive">*</span></label>
            <select
              name="verdict"
              defaultValue={editing?.verdict ?? 'unverified'}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm
                         shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="true">True</option>
              <option value="false">False</option>
              <option value="misleading">Misleading</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Source credibility</label>
            <select
              name="source_credibility"
              defaultValue={editing?.source_credibility ?? 'unverified'}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm
                         shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="official">Official</option>
              <option value="news_outlet">News outlet</option>
              <option value="civil_society">Civil society</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>

        {/* Explanation */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Explanation <span className="text-destructive">*</span></label>
          <Textarea
            name="explanation"
            defaultValue={editing?.explanation ?? ''}
            placeholder="Explain the verdict with evidence…"
            rows={3}
            required
          />
        </div>

        {/* Source URL */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Source URL</label>
          <Input
            name="source_url"
            type="url"
            defaultValue={editing?.source_url ?? ''}
            placeholder="https://…"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <SubmitBtn label={isEditing ? 'Save changes' : 'Create fact-check'} />
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

// ── Delete button ─────────────────────────────────────────────────────────────

function DeleteFactCheckButton({ id, claim }: { id: string; claim: string }) {
  const [, formAction] = useFormState(deleteFactCheck, initial);

  return (
    <ConfirmationDialog
      title="Delete fact-check"
      description={`Delete this fact-check: "${claim.slice(0, 80)}…"? This cannot be undone.`}
      confirmLabel="Delete"
      variant="destructive"
      trigger={
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">Delete</span>
        </Button>
      }
      onConfirm={() => {
        const fd = new FormData();
        fd.set('id', id);
        formAction(fd);
      }}
    />
  );
}

// ── Main manager component ────────────────────────────────────────────────────

export function FactCheckManager({
  factChecks,
  candidates,
}: {
  factChecks: FactCheck[];
  candidates: Candidate[];
}) {
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<FactCheck | undefined>();

  // Build candidate name lookup
  const candidateMap = Object.fromEntries(candidates.map((c) => [c.id, c.full_name]));

  const columns: ColumnDef<FactCheck>[] = [
    {
      accessorKey: 'candidate_id',
      header: 'Candidate',
      cell: ({ getValue }) => (
        <span className="font-medium">{candidateMap[getValue() as string] ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'claim',
      header: 'Claim',
      cell: ({ getValue }) => (
        <span className="line-clamp-2 text-sm">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'verdict',
      header: 'Verdict',
      cell: ({ getValue }) => <VerdictBadge verdict={getValue() as string} />,
    },
    {
      accessorKey: 'source_credibility',
      header: 'Source',
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return <span className="text-xs capitalize">{v?.replace('_', ' ') ?? '—'}</span>;
      },
    },
    {
      accessorKey: 'checked_by',
      header: 'Checked by',
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">{(getValue() as string | null) ?? '—'}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost" size="sm" className="h-7 w-7 p-0"
            onClick={() => { setEditing(row.original); setShowForm(true); }}
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="sr-only">Edit</span>
          </Button>
          <DeleteFactCheckButton id={row.original.id} claim={row.original.claim} />
        </div>
      ),
    },
  ];

  const handleClose = () => {
    setShowForm(false);
    setEditing(undefined);
  };

  return (
    <div className="space-y-4">
      {/* Add / edit form */}
      {showForm ? (
        <FactCheckForm candidates={candidates} editing={editing} onClose={handleClose} />
      ) : (
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Add fact-check
        </Button>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={factChecks}
        searchColumn="claim"
        searchPlaceholder="Search claims…"
      />
    </div>
  );
}
