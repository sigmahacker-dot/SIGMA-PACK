// GET /api/stats — public counters.
import { db } from '@/lib/db';
import { jsonError } from '@/lib/validation';

export async function GET() {
  try {
    const sql = db();
    const [tools, buyers, subs] = await Promise.all([
      sql`SELECT COUNT(*)::int AS c FROM tools WHERE active = true`,
      sql`SELECT COUNT(*)::int AS c FROM buyers`,
      sql`SELECT COUNT(*)::int AS c FROM orders WHERE status = 'active' AND expires_at > now()`,
    ]);
    return Response.json({
      tools_count: (tools[0] as { c: number }).c,
      buyers_count: (buyers[0] as { c: number }).c,
      active_subs: (subs[0] as { c: number }).c,
    });
  } catch (err) {
    return jsonError(err);
  }
}
