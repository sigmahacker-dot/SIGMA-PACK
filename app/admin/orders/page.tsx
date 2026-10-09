'use client';

import React from 'react';
import {
  api, Empty, ErrorNote, Field, Modal, PageHeader, Spinner, SuccessNote,
  fmtDate, fmtRs,
} from '@/components/admin/ui';

type Order = {
  id: string;
  buyer_name: string;
  buyer_email: string;
  plan_name: string;
  months: number;
  price_pkr: number;
  status: string;
  payment_note?: string;
  created_at: string;
  activated_at?: string;
  expires_at?: string;
};

const TABS = ['pending', 'active', 'expired', 'cancelled', 'all'];

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-300',
  active: 'bg-emerald-500/15 text-emerald-300',
  expired: 'bg-slate-500/15 text-slate-300',
  cancelled: 'bg-red-500/15 text-red-300',
};

export default function AdminOrdersPage() {
  const [status, setStatus] = React.useState('pending');
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [noteOrder, setNoteOrder] = React.useState<Order | null>(null);
  const [noteText, setNoteText] = React.useState('');
  const [savingNote, setSavingNote] = React.useState(false);
  const [flash, setFlash] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api(`/api/admin/orders?status=${status}`);
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  React.useEffect(() => {
    load();
  }, [load]);

  const setOrderStatus = async (order: Order, next: string) => {
    const label = next === 'active' ? 'activate' : next;
    if (!confirm(`Are you sure you want to ${label} the order for ${order.buyer_email}?`)) return;
    setError('');
    try {
      await api(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      setFlash(`Order ${next}.`);
      await load();
    } catch (err: any) {
      setError(err.message || 'Update failed.');
    }
  };

  const openNote = (order: Order) => {
    setNoteOrder(order);
    setNoteText(order.payment_note || '');
  };

  const saveNote = async () => {
    if (!noteOrder) return;
    setSavingNote(true);
    setError('');
    try {
      await api(`/api/admin/orders/${noteOrder.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ payment_note: noteText }),
      });
      setNoteOrder(null);
      setFlash('Payment note saved.');
      await load();
    } catch (err: any) {
      setError(err.message || 'Could not save note.');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div>
      <PageHeader title="Orders" sub="Review, activate, or close buyer orders" />

      {flash && <div className="mb-4"><SuccessNote message={flash} /></div>}
      {error && <div className="mb-4"><ErrorNote message={error} /></div>}

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setStatus(t)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition-colors ${
              status === t
                ? 'bg-brand/20 text-brand-light'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <Empty text={`No ${status} orders found.`} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Buyer</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{o.buyer_name}</div>
                    <div className="text-xs text-slate-400">{o.buyer_email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {o.plan_name} <span className="text-xs text-slate-500">({o.months} mo)</span>
                  </td>
                  <td className="px-4 py-3 text-white">{fmtRs(o.price_pkr)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[o.status] || 'bg-white/10 text-slate-300'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(o.created_at)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(o.expires_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openNote(o)}
                        title={o.payment_note ? o.payment_note : 'Add payment note'}
                        className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
                      >
                        {o.payment_note ? '✎ Note' : 'Note'}
                      </button>
                      {o.status === 'pending' && (
                        <button
                          onClick={() => setOrderStatus(o, 'active')}
                          className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"
                        >
                          Activate
                        </button>
                      )}
                      {(o.status === 'pending' || o.status === 'active') && (
                        <button
                          onClick={() => setOrderStatus(o, o.status === 'pending' ? 'cancelled' : 'expired')}
                          className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/25"
                        >
                          {o.status === 'pending' ? 'Cancel' : 'Expire'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {noteOrder && (
        <Modal title={`Payment note — ${noteOrder.buyer_email}`} onClose={() => setNoteOrder(null)}>
          <Field label="Note (e.g. transaction ID, sender name)">
            <textarea
              className="input-dark min-h-24"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
          </Field>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setNoteOrder(null)}
              className="rounded-xl border border-white/15 px-5 py-2.5 text-sm text-slate-200 hover:bg-white/10"
            >
              Cancel
            </button>
            <button onClick={saveNote} disabled={savingNote} className="btn-primary !px-5 !py-2.5 !text-sm disabled:opacity-60">
              {savingNote ? 'Saving…' : 'Save Note'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
