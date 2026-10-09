// GET /api/admin/orders?status= — admin order list with buyer + plan.
import { db } from '@/lib/db';
import { jsonError, optString, bad } from '@/lib/validation';
import { requireAdmin } from '@/lib/guard';

const STATUSES = ['pending', 'active', 'expired', 'cancelled'];

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const status = optString(url.searchParams.get('status'), 'status', 20);
    if (status !== '' && !STATUSES.includes(status)) throw bad('Invalid status filter.');
    const sql = db();
    const rows = await sql`
      SELECT o.id, o.months, o.price_pkr, o.status, o.payment_note, o.created_at,
             o.activated_at, o.expires_at,
             b.name AS buyer_name, b.email AS buyer_email,
             p.name AS plan_name
      FROM orders o
      JOIN buyers b ON b.id = o.buyer_id
      JOIN plans p ON p.id = o.plan_id
      WHERE (${status} = '' OR o.status = ${status})
      ORDER BY o.created_at DESC`;
    return Response.json({ orders: rows });
  } catch (err) {
    return jsonError(err);
  }
}
