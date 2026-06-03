'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createCandidate, updateCandidate, type AdminActionState } from '@/app/actions/admin-candidates';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { NIGERIAN_STATES, MAJOR_PARTIES } from '@/types';
import type { Row } from '@/types';
import { CheckCircle, AlertCircle } from 'lucide-react';

type Candidate = Row<'candidates'>;

interface Props {
  candidate?: Candidate;
}

// ── Submit button ─────────────────────────────────────────────────────────────

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : isEditing ? 'Save changes' : 'Create candidate'}
    </Button>
  );
}

// ── Field helpers ─────────────────────────────────────────────────────────────

function Field({
  label,
  name,
  children,
  required,
}: {
  label: string;
  name: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function SelectField({
  name,
  defaultValue,
  options,
  placeholder,
  required,
}: {
  name: string;
  defaultValue?: string | null;
  options: readonly string[] | string[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <select
      id={name}
      name={name}
      defaultValue={defaultValue ?? ''}
      required={required}
      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm
                 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────

const initial: AdminActionState = { status: 'idle', message: '' };

export function CandidateForm({ candidate }: Props) {
  const isEditing = !!candidate;
  const action = isEditing ? updateCandidate : createCandidate;
  const [state, formAction] = useFormState(action, initial);

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {/* Hidden ID for edit mode */}
      {isEditing && <input type="hidden" name="id" value={candidate.id} />}

      {/* Status feedback */}
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
            : <AlertCircle className="h-4 w-4 shrink-0" />
          }
          {state.message}
        </div>
      )}

      {/* Section: Basic info */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Basic Information
        </h2>

        <Field label="Full name" name="full_name" required>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={candidate?.full_name ?? ''}
            placeholder="e.g. Bola Ahmed Tinubu"
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Party affiliation" name="party_affiliation" required>
            <Input
              id="party_affiliation"
              name="party_affiliation"
              defaultValue={candidate?.party_affiliation ?? ''}
              placeholder="e.g. APC"
              list="parties-list"
              required
            />
            <datalist id="parties-list">
              {MAJOR_PARTIES.map((p) => <option key={p} value={p} />)}
            </datalist>
          </Field>

          <Field label="Election type" name="election_type" required>
            <SelectField
              name="election_type"
              defaultValue={candidate?.election_type}
              options={['presidential', 'gubernatorial', 'senatorial', 'house_of_reps', 'state_assembly']}
              placeholder="Select type"
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Date of birth" name="date_of_birth">
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              defaultValue={candidate?.date_of_birth ?? ''}
            />
          </Field>

          <Field label="Photo URL" name="photo_url">
            <Input
              id="photo_url"
              name="photo_url"
              type="url"
              defaultValue={candidate?.photo_url ?? ''}
              placeholder="https://…"
            />
          </Field>
        </div>
      </div>

      {/* Section: Location */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Location
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="State" name="state">
            <SelectField
              name="state"
              defaultValue={candidate?.state}
              options={[...NIGERIAN_STATES]}
              placeholder="Select state"
            />
          </Field>

          <Field label="State of origin" name="state_of_origin">
            <SelectField
              name="state_of_origin"
              defaultValue={candidate?.state_of_origin}
              options={[...NIGERIAN_STATES]}
              placeholder="Select state"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Local government" name="local_government">
            <Input
              id="local_government"
              name="local_government"
              defaultValue={candidate?.local_government ?? ''}
              placeholder="e.g. Ikeja"
            />
          </Field>

          <Field label="Constituency" name="constituency">
            <Input
              id="constituency"
              name="constituency"
              defaultValue={candidate?.constituency ?? ''}
              placeholder="e.g. Lagos Island"
            />
          </Field>
        </div>
      </div>

      {/* Section: Profile */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Profile
        </h2>

        <Field label="Current position" name="current_position">
          <Input
            id="current_position"
            name="current_position"
            defaultValue={candidate?.current_position ?? ''}
            placeholder="e.g. Governor, Lagos State"
          />
        </Field>

        <Field label="Biography" name="biography">
          <Textarea
            id="biography"
            name="biography"
            defaultValue={candidate?.biography ?? ''}
            placeholder="Brief biography…"
            rows={4}
          />
        </Field>
      </div>

      {/* Section: Verification */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Verification
        </h2>

        <div className="flex items-center gap-3">
          <input
            id="is_verified"
            name="is_verified"
            type="checkbox"
            value="true"
            defaultChecked={candidate?.is_verified ?? false}
            className="h-4 w-4 rounded border-input"
          />
          <label htmlFor="is_verified" className="text-sm">
            Mark as verified{' '}
            <span className="text-muted-foreground">
              (sets "Last verified" date to now)
            </span>
          </label>
        </div>

        {isEditing && candidate?.last_verified_at && (
          <p className="text-xs text-muted-foreground">
            Last verified:{' '}
            {new Date(candidate.last_verified_at).toLocaleString('en-NG', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
            {candidate.last_verified_by ? ` by ${candidate.last_verified_by}` : ''}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <SubmitButton isEditing={isEditing} />
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
