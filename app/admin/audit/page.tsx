'use client';

import React from 'react';
import { api, Empty, ErrorNote, PageHeader, Spinner, fmtDate } from '@/components/admin/ui';

type AuditEntry = {
  id: string;
  actor_type: string;
  actor_id: string;
  action: string;
  detail: string;
  created_at: string;
};

const LIMITS = [20, 50, 100, 200];

export default function AdminAuditPage() {
  const [limit, setLimit] = React.useState(50);
  const [entries, setEntries] = React.useState<AuditEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api(`/api/admin/audit?limit=${limit}`);
        setEntries(Array.isArray(data) ? data : data.entries || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load audit log.');
      } finally {
        setLoading(false);
      }
    })();
  }, [limit]);

  return (
    <div>
      <PageHeader
        title="Audit Log"
        sub="Who did what, and when"
        action={
          <select
            className="input-dark !w-40"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            {LIMITS.map((l) => (
              <option key={l} value={l}>Last {l}</option>
            ))}
          </select>
        }
      />

      {error && <div className="mb-4"><ErrorNote message={error} /></div>}

      {loading ? (
        <Spinner />
      ) : entries.length === 0 ? (
        <Empty text="No audit entries yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((a) => (
                <tr key={a.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                    {fmtDate(a.created_at)}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {a.actor_type}
                    {a.actor_id && <span className="text-xs text-slate-500"> #{String(a.actor_id).slice(0, 8)}</span>}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{a.action}</td>
                  <td className="max-w-md truncate px-4 py-3 text-xs text-slate-400" title={a.detail || ''}>
                    {a.detail || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
