'use client';

import React from 'react';
import {
  api, Empty, ErrorNote, Field, Modal, PageHeader, Spinner, SuccessNote, fmtRs,
} from '@/components/admin/ui';

type Plan = {
  id: string;
  slug?: string;
  name: string;
  months: number;
  price_pkr: number;
  features?: string[];
  active: boolean;
  sort?: number;
};

const EMPTY_FORM = {
  name: '',
  slug: '',
  months: '1',
  price_pkr: '',
  features: '',
  sort: '0',
  active: true,
};

export default function AdminPlansPage() {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [flash, setFlash] = React.useState('');
  const [editing, setEditing] = React.useState<Plan | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api('/api/admin/plans');
      setPlans(Array.isArray(data) ? data : data.plans || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load plans.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setAdding(true);
  };

  const openEdit = (p: Plan) => {
    setForm({
      name: p.name,
      slug: p.slug || '',
      months: String(p.months),
      price_pkr: String(p.price_pkr),
      features: (p.features || []).join('\n'),
      sort: String(p.sort ?? 0),
      active: p.active,
    });
    setEditing(p);
    setAdding(false);
  };

  const closeModal = () => {
    setAdding(false);
    setEditing(null);
  };

  const save = async () => {
    if (!form.name.trim() || !form.price_pkr || !form.months) {
      setError('Name, duration (months) and price are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = {
        name: form.name.trim(),
        ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
        months: Number(form.months),
        price_pkr: Number(form.price_pkr),
        features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
        sort: Number(form.sort) || 0,
        active: form.active,
      };
      if (editing) {
        await api(`/api/admin/plans/${editing.id}`, { method: 'PATCH', body: JSON.stringify(body) });
        setFlash(`Plan "${form.name}" updated.`);
      } else {
        await api('/api/admin/plans', { method: 'POST', body: JSON.stringify(body) });
        setFlash(`Plan "${form.name}" created.`);
      }
      closeModal();
      await load();
    } catch (err: any) {
      setError(
        err.status === 409
          ? 'This plan has orders on it, so it cannot be deleted. Deactivate it instead.'
          : err.message || 'Save failed.'
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Plan) => {
    if (!confirm(`Delete plan "${p.name}"? This cannot be undone.`)) return;
    try {
      await api(`/api/admin/plans/${p.id}`, { method: 'DELETE' });
      setFlash(`Plan "${p.name}" deleted.`);
      await load();
    } catch (err: any) {
      setError(
        err.status === 409
          ? 'This plan has orders on it, so it cannot be deleted. Deactivate it instead.'
          : err.message || 'Delete failed.'
      );
    }
  };

  const modalOpen = adding || editing;

  return (
    <div>
      <PageHeader
        title="Plans"
        sub="Subscription plans and pricing"
        action={
          <button onClick={openAdd} className="btn-primary !px-5 !py-2.5 !text-sm">
            + Add Plan
          </button>
        }
      />

      {flash && <div className="mb-4"><SuccessNote message={flash} /></div>}
      {error && <div className="mb-4"><ErrorNote message={error} /></div>}

      {loading ? (
        <Spinner />
      ) : plans.length === 0 ? (
        <Empty text="No plans yet. Add your first plan." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((p) => (
            <div key={p.id} className={`glass rounded-2xl p-5 ${p.active ? '' : 'opacity-60'}`}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-white">{p.name}</h3>
                  {p.slug && <div className="text-xs text-slate-500">/{p.slug}</div>}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-slate-400'}`}>
                  {p.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mb-3">
                <span className="text-2xl font-bold text-brand-light">{fmtRs(p.price_pkr)}</span>
                <span className="ml-2 text-sm text-slate-400">/ {p.months} month{p.months > 1 ? 's' : ''}</span>
              </div>
              {p.features && p.features.length > 0 && (
                <ul className="mb-4 space-y-1.5 text-sm text-slate-300">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-brand-light">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(p)}
                  className="rounded-xl bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/25"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Edit Plan' : 'Add Plan'} onClose={closeModal} wide>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Plan name">
              <input
                className="input-dark"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Monthly"
              />
            </Field>
            <Field label="Slug (optional, auto if empty)">
              <input
                className="input-dark"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="e.g. monthly"
              />
            </Field>
            <Field label="Duration (months)">
              <input
                type="number"
                min={1}
                className="input-dark"
                value={form.months}
                onChange={(e) => setForm({ ...form, months: e.target.value })}
              />
            </Field>
            <Field label="Price (PKR)">
              <input
                type="number"
                min={0}
                className="input-dark"
                value={form.price_pkr}
                onChange={(e) => setForm({ ...form, price_pkr: e.target.value })}
                placeholder="e.g. 799"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Features (one per line)">
                <textarea
                  className="input-dark min-h-24"
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  placeholder={'Access to 100+ AI tools\nPriority WhatsApp support'}
                />
              </Field>
            </div>
            <Field label="Sort order">
              <input
                type="number"
                className="input-dark"
                value={form.sort}
                onChange={(e) => setForm({ ...form, sort: e.target.value })}
              />
            </Field>
            <label className="flex items-center gap-2 self-end pb-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 accent-[#FF6A00]"
              />
              Active (visible to buyers)
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={closeModal}
              className="rounded-xl border border-white/15 px-5 py-2.5 text-sm text-slate-200 hover:bg-white/10"
            >
              Cancel
            </button>
            <button onClick={save} disabled={saving} className="btn-primary !px-5 !py-2.5 !text-sm disabled:opacity-60">
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Plan'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
