'use client';

import React from 'react';
import {
  api, Empty, ErrorNote, Field, PageHeader, Spinner, SuccessNote, fmtDate,
} from '@/components/admin/ui';

type Buyer = { id: string; name: string; email: string };
type Tool = { id: string; name: string; category: string };
type Assignment = {
  id: string;
  buyer_email: string;
  tool_name: string;
  label?: string;
  created_at: string;
};

export default function AdminCredentialsPage() {
  const [buyers, setBuyers] = React.useState<Buyer[]>([]);
  const [tools, setTools] = React.useState<Tool[]>([]);
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [buyerQ, setBuyerQ] = React.useState('');
  const [filterBuyer, setFilterBuyer] = React.useState('');
  const [filterTool, setFilterTool] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [flash, setFlash] = React.useState('');

  // Form state
  const [buyerId, setBuyerId] = React.useState('');
  const [toolId, setToolId] = React.useState('');
  const [label, setLabel] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const loadAssignments = React.useCallback(async (b: string, t: string) => {
    try {
      const params = new URLSearchParams();
      if (b) params.set('buyer_id', b);
      if (t) params.set('tool_id', t);
      const data = await api(`/api/admin/credentials?${params.toString()}`);
      setAssignments(Array.isArray(data) ? data : data.credentials || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load credentials.');
    }
  }, []);

  const loadBase = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [b, t] = await Promise.all([
        api('/api/admin/buyers?q='),
        api('/api/admin/tools'),
      ]);
      const bl: Buyer[] = Array.isArray(b) ? b : b.buyers || [];
      const tl: Tool[] = Array.isArray(t) ? t : t.tools || [];
      setBuyers(bl);
      setTools(tl);
      if (bl.length > 0) setBuyerId(bl[0].id);
      if (tl.length > 0) setToolId(tl[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadBase();
  }, [loadBase]);

  React.useEffect(() => {
    loadAssignments(filterBuyer, filterTool);
  }, [filterBuyer, filterTool, loadAssignments]);

  const assign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!buyerId || !toolId) {
      setError('Choose a buyer and a tool.');
      return;
    }
    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }
    setSaving(true);
    try {
      await api('/api/admin/credentials', {
        method: 'POST',
        body: JSON.stringify({
          buyer_id: buyerId,
          tool_id: toolId,
          ...(label.trim() ? { label: label.trim() } : {}),
          username,
          password,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        }),
      });
      setLabel('');
      setUsername('');
      setPassword('');
      setNotes('');
      setFlash('Credentials assigned to the buyer.');
      await loadAssignments(filterBuyer, filterTool);
    } catch (err: any) {
      setError(err.message || 'Assignment failed.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a: Assignment) => {
    if (!confirm(`Remove credentials for ${a.buyer_email} → ${a.tool_name}? The buyer will lose this login.`)) return;
    try {
      await api(`/api/admin/credentials/${a.id}`, { method: 'DELETE' });
      setFlash('Credentials removed.');
      await loadAssignments(filterBuyer, filterTool);
    } catch (err: any) {
      setError(err.message || 'Delete failed.');
    }
  };

  const filteredBuyers = buyers.filter(
    (b) =>
      !buyerQ ||
      b.name.toLowerCase().includes(buyerQ.toLowerCase()) ||
      b.email.toLowerCase().includes(buyerQ.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Credentials"
        sub="Assign tool logins to buyers — passwords are stored securely and never shown back"
      />

      {flash && <div className="mb-4"><SuccessNote message={flash} /></div>}
      {error && <div className="mb-4"><ErrorNote message={error} /></div>}

      {loading ? (
        <Spinner />
      ) : (
        <>
          <form onSubmit={assign} className="glass mb-8 rounded-2xl p-6">
            <h2 className="mb-4 font-bold text-white">Assign Credentials</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Field label="Buyer">
                  <input
                    className="input-dark mb-2"
                    placeholder="Search buyer…"
                    value={buyerQ}
                    onChange={(e) => setBuyerQ(e.target.value)}
                  />
                  <select
                    className="input-dark"
                    value={buyerId}
                    onChange={(e) => setBuyerId(e.target.value)}
                  >
                    <option value="">Select buyer…</option>
                    {filteredBuyers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} — {b.email}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Tool">
                <select
                  className="input-dark"
                  value={toolId}
                  onChange={(e) => setToolId(e.target.value)}
                >
                  <option value="">Select tool…</option>
                  {tools.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Label (optional)">
                <input
                  className="input-dark"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Premium account 2"
                />
              </Field>
              <div />
              <Field label="Login username">
                <input
                  className="input-dark"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                />
              </Field>
              <Field label="Login password">
                <input
                  type="password"
                  className="input-dark"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notes (optional)">
                  <textarea
                    className="input-dark min-h-16"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Field>
              </div>
            </div>
            <div className="mt-5">
              <button type="submit" disabled={saving} className="btn-primary !px-6 disabled:opacity-60">
                {saving ? 'Assigning…' : 'Assign Credentials'}
              </button>
            </div>
          </form>

          <div className="mb-5 flex flex-wrap gap-3">
            <select
              className="input-dark !w-64"
              value={filterBuyer}
              onChange={(e) => setFilterBuyer(e.target.value)}
            >
              <option value="">All buyers</option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>{b.name} — {b.email}</option>
              ))}
            </select>
            <select
              className="input-dark !w-64"
              value={filterTool}
              onChange={(e) => setFilterTool(e.target.value)}
            >
              <option value="">All tools</option>
              {tools.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {assignments.length === 0 ? (
            <Empty text="No credentials assigned yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500">
                    <th className="px-4 py-3">Buyer</th>
                    <th className="px-4 py-3">Tool</th>
                    <th className="px-4 py-3">Label</th>
                    <th className="px-4 py-3">Assigned</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-white">{a.buyer_email}</td>
                      <td className="px-4 py-3 text-slate-300">{a.tool_name}</td>
                      <td className="px-4 py-3 text-slate-400">{a.label || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(a.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => remove(a)}
                          className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/25"
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
        </>
      )}
    </div>
  );
}
