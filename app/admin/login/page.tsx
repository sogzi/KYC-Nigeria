'use client';

import { useFormState } from 'react-dom';
import { useFormStatus } from 'react-dom';
import { adminLogin, type LoginState } from '@/app/actions/admin-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

// ── Submit button ─────────────────────────────────────────────────────────────

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const initial: LoginState = { status: 'idle', message: '' };

export default function AdminLoginPage() {
  const [state, formAction] = useFormState(adminLogin, initial);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">KYC Nigeria</h1>
          <p className="text-sm text-muted-foreground">Admin Dashboard</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-lg">Sign in</h2>

          {state.status === 'error' && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.message}
            </div>
          )}

          <form action={formAction} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </div>

            <SubmitButton />
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Restricted access — authorised administrators only.
        </p>
      </div>
    </div>
  );
}
