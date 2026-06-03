'use client';

import { useFormState } from 'react-dom';
import { ConfirmationDialog } from '@/components/admin/confirmation-dialog';
import { deleteCandidate, type AdminActionState } from '@/app/actions/admin-candidates';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const initial: AdminActionState = { status: 'idle', message: '' };

export function DeleteCandidateButton({ id, name }: { id: string; name: string }) {
  const [, formAction] = useFormState(deleteCandidate, initial);

  const trigger = (
    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
      <Trash2 className="h-3.5 w-3.5" />
      <span className="sr-only">Delete</span>
    </Button>
  );

  return (
    <ConfirmationDialog
      title="Delete candidate"
      description={`Are you sure you want to permanently delete "${name}"? This cannot be undone.`}
      confirmLabel="Delete"
      variant="destructive"
      trigger={trigger}
      onConfirm={() => {
        const fd = new FormData();
        fd.set('id', id);
        formAction(fd);
      }}
    />
  );
}
