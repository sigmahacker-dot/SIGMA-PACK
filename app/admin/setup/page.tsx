'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { api, ErrorNote, Field, Spinner } from '@/components/admin/ui';

export default function AdminSetupPage() {
  const router = useRouter();
  const [checking, setChecking] = React.useState(true);
  const [needsSetup, setNeedsSetup] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const data = await api('/api/admin/setup/status');
        setNeedsSetup(!!data.needsSetup);
      } catch (err: any) {
        setError(err.message || 'Could not check setup status.');
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      await api('/api/admin/setup', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
      router.push('/admin/login?created=1');
    } catch (err: any) {
      setError(err.message || 'Setup failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hero-grid-bg flex min-h-screen items-center justify-center p-4">
      <div className="glass w-full max-w-sm rounded-2xl p-8 card-glow">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-light text-2xl font-black text-white">
            Σ
          </div>
          <h1 className="text-xl font-bold text-white">Admin Setup</h1>
          <p className="mt-1 text-sm text-slate-400">Create the first admin account</p>
        </div>

        {checking ? (
          <Spinner />
        ) : !needsSetup && !error ? (
          <div className="text-center">
            <p className="mb-4 text-sm text-slate-300">
              Setup is disabled — an admin already exists.
            </p>
            <Link href="/admin/login" className="btn-primary w-full">
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && <ErrorNote message={error} />}
            <Field label="Username">
              <input
                className="input-dark"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className="input-dark"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                className="input-dark"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </Field>
            <Field label="Confirm Password">
              <input
                type="password"
                className="input-dark"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </Field>
            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
              {busy ? 'Creating…' : 'Create Admin Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
