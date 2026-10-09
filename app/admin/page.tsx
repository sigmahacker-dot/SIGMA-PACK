'use client';

import Link from 'next/link';
import React from 'react';
import { api, Empty, ErrorNote, PageHeader, Spinner, fmtDate, fmtRs } from '@/components/admin/ui';

type Stats = {
  buyers: number;
  active_subs: number;
  pending_orders: number;
  revenue_pkr: number;
  tools_count: number;
};

type Order = {
  id: string;
  buyer_name: string;
  buyer_email: string;
  plan_name: string;
  months: number;
  price_pkr: number;
  status: string;
  created_at: string;
};

type AuditEntry = {
  id: string;
  actor_type: string;
  actor_id: string;
  action: string;
  detail: string;
  created_at: string;
};

const CARDS: { key: keyof Stats; label: string; icon: string }[] = [
  { key: 'buyers', label: 'Total Buyers', icon: '👥' },
  { key: 'active_subs', label: 'Active Subscriptions', icon: '✅' },
  { key: 'pending_orders', label: 'Pending Orders', icon: '⏳' },
  { key: 'revenue_pkr', label: 'Revenue (PKR)', icon: '💰' },
  { key: 'tools_count', label: 'Tools Count', icon: '🛠️' },
];

export default function AdminDashboard() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [pending, setPending] = React.useState<Order[]>([]);
  const [audit, setAudit] = React.useState<AuditEntry[]>([]);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    (async () => {
      try {
        const [s, o, a] = await Promise.all([
          api('/api/admin/stats'),
          api('/api/admin/orders?status=pending'),
          api('/api/admin/audit?limit=8'),
        ]);
        setStats(s);
        setPending(Array.isArray(o) ? o.slice(0, 5) : (o.orders || []).slice(0, 5));
        setAudit(Array.isArray(a) ? a.slice(0, 8) : (a.entries || []).slice(0, 8));
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard.');
      }
    })();
  }, []);

  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard" sub="Overview of your Sigma Pack business" />
        <ErrorNote message={error} />
      </div>
    );
  }

  if (!stats) return <Spinner />;

  return (
    <div>
      <PageHeader title="Dashboard" sub="Overview of your Sigma Pack business" />

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {CARDS.map((c) => (
          <div key={c.key} className="glass rounded-2xl p-5">
            <div className="mb-2 text-2xl">{c.icon}</div>
            <div className="text-2xl font-bold text-white">
              {c.key === 'revenue_pkr' ? fmtRs(stats[c.key]) : Number(stats[c.key] ?? 0).toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-slate-400">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-white">Pending Orders</h2>
            <Link href="/admin/orders" className="text-sm text-brand-light hover:underline">
              View all →
            </Link>
          </div>
          {pending.length === 0 ? (
            <Empty text="No pending orders right now." />
          ) : (
            <div className="space-y-3">
              {pending.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{o.buyer_name}</div>
                    <div className="truncate text-xs text-slate-400">
                      {o.plan_name} · {fmtRs(o.price_pkr)} · {fmtDate(o.created_at)}
                    </div>
                  </div>
                  <Link
                    href="/admin/orders"
                    className="shrink-0 rounded-lg bg-brand/15 px-3 py-1.5 text-xs font-semibold text-brand-light hover:bg-brand/25"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-white">Recent Activity</h2>
            <Link href="/admin/audit" className="text-sm text-brand-light hover:underline">
              Full log →
            </Link>
          </div>
          {audit.length === 0 ? (
            <Empty text="No activity recorded yet." />
          ) : (
            <div className="space-y-2">
              {audit.map((a) => (
                <div key={a.id} className="rounded-xl bg-white/5 px-4 py-2.5 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-white">{a.action}</span>
                    <span className="shrink-0 text-xs text-slate-500">{fmtDate(a.created_at)}</span>
                  </div>
                  {a.detail && (
                    <div className="mt-0.5 truncate text-xs text-slate-400">{a.detail}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
