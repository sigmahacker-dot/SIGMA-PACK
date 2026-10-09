'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { api, ErrorNote, Field, SuccessNote } from '@/components/admin/ui';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const created = params.get('created');
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(
        err.status === 401
          ? 'Wrong username/email or password. Try again.'
          : err.message || 'Login failed.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="glass w-full max-w-sm rounded-2xl p-8 card-glow"
    >
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-light text-2xl font-black text-white">
          Σ
        </div>
        <h1 className="text-xl font-bold text-white">Admin Login</h1>
        <p className="mt-1 text-sm text-slate-400">Sigma Pack control panel</p>
      </div>

      {created && (
        <div className="mb-4">
          <SuccessNote message="Admin account created. Sign in to continue." />
        </div>
      )}
      {error && <div className="mb-4"><ErrorNote message={error} /></div>}

      <div className="space-y-4">
        <Field label="Username or Email">
          <input
            className="input-dark"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            required
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            className="input-dark"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </div>

      <p className="mt-5 text-center text-xs text-slate-500">
        First time here? <Link href="/admin/setup" className="text-brand-light hover:underline">Create the admin account</Link>
      </p>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="hero-grid-bg flex min-h-screen items-center justify-center p-4">
      <React.Suspense fallback={<div className="text-slate-400">Loading…</div>}>
        <LoginForm />
      </React.Suspense>
    </div>
  );
}
