// GET /api/subscription — buyer: active subscription (lazy-expire) + history.
import { db } from '@/lib/db';
import { jsonError } from '@/lib/validation';
import { expireStaleOrders, requireBuyer } from '@/lib/guard';

export async function GET() {
  try {
    const session = await requireBuyer();
    const sql = db();
    await expireStaleOrders(sql, session.sub);

    const activeRows = await sql`
      SELECT o.id, o.months, o.price_pkr, o.status, o.created_at, o.activated_at, o.expires_at,
             p.name AS plan_name, p.slug AS plan_slug
      FROM orders o JOIN plans p ON p.id = o.plan_id
      WHERE o.buyer_id = ${session.sub} AND o.status = 'active'
      ORDER BY o.created_at DESC LIMIT 1`;

    const historyRows = await sql`
      SELECT o.id, p.name AS plan_name, o.months, o.price_pkr, o.status, o.created_at, o.expires_at
      FROM orders o JOIN plans p ON p.id = o.plan_id
      WHERE o.buyer_id = ${session.sub}
      ORDER BY o.created_at DESC`;

    return Response.json({
      subscription: activeRows[0] ?? null,
      history: historyRows,
    });
  } catch (err) {
    return jsonError(err);
  }
}
