'use client';

import React from 'react';
import {
  api, Empty, ErrorNote, Field, Modal, PageHeader, Spinner, SuccessNote,
} from '@/components/admin/ui';

type Tool = {
  id: string;
  name: string;
  category: string;
  description?: string;
  url?: string;
  active: boolean;
  sort?: number;
  icon_svg?: string;
};

const EMPTY_FORM = {
  name: '',
  category: '',
  description: '',
  url: '',
  sort: '0',
  active: true,
};

export default function AdminToolsPage() {
  const [q, setQ] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [tools, setTools] = React.useState<Tool[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [flash, setFlash] = React.useState('');
  const [editing, setEditing] = React.useState<Tool | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [customCat, setCustomCat] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async (query: string, cat: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (cat) params.set('category', cat);
      const data = await api(`/api/admin/tools?${params.toString()}`);
      const list: Tool[] = Array.isArray(data) ? data : data.tools || [];
      setTools(list);
      setCategories((prev) => {
        const fromData = data.categories || [];
        const fromList = Array.from(new Set(list.map((t) => t.category).filter(Boolean)));
        const merged = Array.from(new Set([...fromData, ...fromList, ...prev]));
        return merged as string[];
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load tools.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => load(q, category), 400);
    return () => clearTimeout(t);
  }, [q, category, load]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setCustomCat(false);
    setEditing(null);
    setAdding(true);
  };

  const openEdit = (t: Tool) => {
    setForm({
      name: t.name,
      category: t.category,
      description: t.description || '',
      url: t.url || '',
      sort: String(t.sort ?? 0),
      active: t.active,
    });
    setCustomCat(!categories.includes(t.category));
    setEditing(t);
    setAdding(false);
  };

  const closeModal = () => {
    setAdding(false);
    setEditing(null);
  };

  const save = async () => {
    if (!form.name.trim() || !form.category.trim()) {
      setError('Name and category are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = {
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim() || undefined,
        url: form.url.trim() || undefined,
        sort: Number(form.sort) || 0,
        active: form.active,
      };
      if (editing) {
        await api(`/api/admin/tools/${editing.id}`, { method: 'PATCH', body: JSON.stringify(body) });
        setFlash(`Tool "${form.name}" updated.`);
      } else {
        await api('/api/admin/tools', { method: 'POST', body: JSON.stringify(body) });
        setFlash(`Tool "${form.name}" added.`);
      }
      closeModal();
      await load(q, category);
    } catch (err: any) {
      setError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (t: Tool) => {
    try {
      await api(`/api/admin/tools/${t.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !t.active }),
      });
      await load(q, category);
    } catch (err: any) {
      setError(err.message || 'Toggle failed.');
    }
  };

  const remove = async (t: Tool) => {
    if (!confirm(`Delete tool "${t.name}"? This cannot be undone.`)) return;
    try {
      await api(`/api/admin/tools/${t.id}`, { method: 'DELETE' });
      setFlash(`Tool "${t.name}" deleted.`);
      await load(q, category);
    } catch (err: any) {
      setError(err.message || 'Delete failed.');
    }
  };

  const modalOpen = adding || editing;

  return (
    <div>
      <PageHeader
        title="Tools"
        sub="Manage the AI tools catalogue"
        action={
          <button onClick={openAdd} className="btn-primary !px-5 !py-2.5 !text-sm">
            + Add Tool
          </button>
        }
      />

      {flash && <div className="mb-4"><SuccessNote message={flash} /></div>}
      {error && <div className="mb-4"><ErrorNote message={error} /></div>}

      <div className="mb-5 flex flex-wrap gap-3">
        <input
          className="input-dark !w-64"
          placeholder="Search tools…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="input-dark !w-52"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : tools.length === 0 ? (
        <Empty text="No tools found." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Tool</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((t) => (
                <tr key={t.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {t.icon_svg ? (
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 [&>svg]:h-5 [&>svg]:w-5"
                          dangerouslySetInnerHTML={{ __html: t.icon_svg }}
                        />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-lg">
                          🛠️
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-medium text-white">{t.name}</div>
                        {t.url && <div className="truncate text-xs text-slate-500">{t.url}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{t.category}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(t)}
                      title="Toggle active"
                      className={`relative h-6 w-11 rounded-full transition-colors ${t.active ? 'bg-emerald-500/70' : 'bg-white/15'}`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${t.active ? 'left-[22px]' : 'left-0.5'}`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(t)}
                        className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(t)}
                        className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/25"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Edit Tool' : 'Add Tool'} onClose={closeModal} wide>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                className="input-dark"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Category">
              {customCat ? (
                <input
                  className="input-dark"
                  placeholder="New category name"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              ) : (
                <select
                  className="input-dark"
                  value={form.category}
                  onChange={(e) => {
                    if (e.target.value === '__new__') {
                      setCustomCat(true);
                      setForm({ ...form, category: '' });
                    } else {
                      setForm({ ...form, category: e.target.value });
                    }
                  }}
                >
                  <option value="">Select…</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__new__">+ New category</option>
                </select>
              )}
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <textarea
                  className="input-dark min-h-20"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>
            </div>
            <Field label="URL (optional)">
              <input
                className="input-dark"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://…"
              />
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                className="input-dark"
                value={form.sort}
                onChange={(e) => setForm({ ...form, sort: e.target.value })}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-300">
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
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Tool'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
