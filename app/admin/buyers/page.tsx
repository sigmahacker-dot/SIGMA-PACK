'use client';

import React from 'react';
import {
  api, Empty, ErrorNote, Field, Modal, PageHeader, Spinner, SuccessNote, fmtDate,
} from '@/components/admin/ui';

type Buyer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  active_plan?: string | null;
  active_expires_at?: string | null;
};

export default function AdminBuyersPage() {
  const [q, setQ] = React.useState('');
  const [buyers, setBuyers] = React.useState<Buyer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [resetBuyer, setResetBuyer] = React.useState<Buyer | null>(null);
  const [newPass, setNewPass] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [flash, setFlash] = React.useState('');

  const load = React.useCallback(async (query: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await api(`/api/admin/buyers?q=${encodeURIComponent(query)}`);
      setBuyers(Array.isArray(data) ? data : data.buyers || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load buyers.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load('');
  }, [load]);

  // Debounced search
  React.useEffect(() => {
    const t = setTimeout(() => load(q), 400);
    return () => clearTimeout(t);
  }, [q, load]);

  const resetPassword = async () => {
    if (!resetBuyer) return;
    if (newPass.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api(`/api/admin/buyers/${resetBuyer.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password: newPass }),
      });
      setResetBuyer(null);
      setNewPass('');
      setFlash(`Password for ${resetBuyer.email} has been reset.`);
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setSaving(false);
    }
  };

  const removeBuyer = async (b: Buyer) => {
    if (!confirm(`Delete buyer "${b.email}"? Their orders and credentials will be removed too. This cannot be undone.`)) return;
    setError('');
    try {
      await api(`/api/admin/buyers/${b.id}`, { method: 'DELETE' });
      setFlash(`Buyer ${b.email} deleted.`);
      await load(q);
    } catch (err: any) {
      setError(err.message || 'Delete failed.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Buyers"
        sub="Search buyers and manage their access"
        action={
          <input
            className="input-dark !w-64"
            placeholder="Search name or email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        }
      />

      {flash && <div className="mb-4"><SuccessNote message={flash} /></div>}
      {error && <div className="mb-4"><ErrorNote message={error} /></div>}

      {loading ? (
        <Spinner />
      ) : buyers.length === 0 ? (
        <Empty text="No buyers found." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Active Plan</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {buyers.map((b) => (
                <tr key={b.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{b.name}</td>
                  <td className="px-4 py-3 text-slate-300">{b.email}</td>
                  <td className="px-4 py-3 text-slate-400">{b.phone || '—'}</td>
                  <td className="px-4 py-3">
                    {b.active_plan ? (
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                        {b.active_plan}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(b.active_expires_at)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => { setResetBuyer(b); setNewPass(''); }}
                      className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
                    >
                      Reset password
                    </button>
                    <button
                      onClick={() => removeBuyer(b)}
                      className="ml-2 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/25"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resetBuyer && (
        <Modal title={`Reset password — ${resetBuyer.email}`} onClose={() => setResetBuyer(null)}>
          <p className="mb-4 text-sm text-slate-400">
            Type a new password for this buyer. The password is never shown back to you after this.
          </p>
          <Field label="New password (min 8 characters)">
            <input
              type="password"
              className="input-dark"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setResetBuyer(null)}
              className="rounded-xl border border-white/15 px-5 py-2.5 text-sm text-slate-200 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={resetPassword}
              disabled={saving}
              className="btn-primary !px-5 !py-2.5 !text-sm disabled:opacity-60"
            >
              {saving ? 'Resetting…' : 'Reset Password'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
