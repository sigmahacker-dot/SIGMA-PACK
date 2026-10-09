// PATCH /api/admin/orders/[id] — admin: activate / expire / cancel an order.
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { parseBody, requireAdmin, reqUuid } from '@/lib/guard';
import { jsonError, optString, bad, ApiError } from '@/lib/validation';

const ALLOWED = ['active', 'expired', 'cancelled'] as const;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdmin();
    const id = reqUuid(params.id);
    const body = await parseBody(req);
    const status = body.status;
    if (typeof status !== 'string' || !(ALLOWED as readonly string[]).includes(status)) {
      throw bad('status must be one of: active, expired, cancelled.');
    }
    const payment_note = body.payment_note === undefined ? undefined : optString(body.payment_note, 'payment_note', 2000);

    const sql = db();
    const rows = await sql`SELECT id, status, months FROM orders WHERE id = ${id}`;
    const order = rows[0] as { id: string; status: string; months: number } | undefined;
    if (!order) throw new ApiError(404, 'Not found.');

    if (status === 'active') {
      // Activation only from pending; sets activated_at/expires_at from order.months.
      if (order.status !== 'pending') {
        throw bad('Only pending orders can be activated.');
      }
      await sql`UPDATE orders
        SET status = 'active', activated_at = now(), expires_at = now() + (months * INTERVAL '1 month')
            ${payment_note === undefined ? sql`` : sql`, payment_note = ${payment_note}`}
        WHERE id = ${id}`;
    } else {
      await sql`UPDATE orders
        SET status = ${status}
            ${payment_note === undefined ? sql`` : sql`, payment_note = ${payment_note}`}
        WHERE id = ${id}`;
    }

    await logAudit('admin', session.sub, 'order_status_changed', `order ${id} → ${status}`);
    const updated = await sql`
      SELECT o.id, o.months, o.price_pkr, o.status, o.payment_note, o.created_at,
             o.activated_at, o.expires_at, b.email AS buyer_email, p.name AS plan_name
      FROM orders o JOIN buyers b ON b.id = o.buyer_id JOIN plans p ON p.id = o.plan_id
      WHERE o.id = ${id}`;
    return Response.json({ order: updated[0] });
  } catch (err) {
    return jsonError(err);
  }
}
