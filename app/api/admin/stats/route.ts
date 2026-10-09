// GET /api/admin/stats — admin dashboard counters.
import { db } from '@/lib/db';
import { jsonError } from '@/lib/validation';
import { requireAdmin } from '@/lib/guard';

export async function GET() {
  try {
    await requireAdmin();
    const sql = db();
    const [buyers, subs, pending, revenue, tools] = await Promise.all([
      sql`SELECT COUNT(*)::int AS c FROM buyers`,
      sql`SELECT COUNT(*)::int AS c FROM orders WHERE status = 'active' AND expires_at > now()`,
      sql`SELECT COUNT(*)::int AS c FROM orders WHERE status = 'pending'`,
      sql`SELECT COALESCE(SUM(price_pkr), 0)::int AS c FROM orders WHERE status = 'active'`,
      sql`SELECT COUNT(*)::int AS c FROM tools`,
    ]);
    return Response.json({
      buyers: (buyers[0] as { c: number }).c,
      active_subs: (subs[0] as { c: number }).c,
      pending_orders: (pending[0] as { c: number }).c,
      revenue_pkr: (revenue[0] as { c: number }).c,
      tools_count: (tools[0] as { c: number }).c,
    });
  } catch (err) {
    return jsonError(err);
  }
}
