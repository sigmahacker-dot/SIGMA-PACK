// GET /api/admin/buyers?q= — buyers with active-subscription summary.
import { db } from '@/lib/db';
import { jsonError, optString } from '@/lib/validation';
import { requireAdmin } from '@/lib/guard';

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const q = optString(url.searchParams.get('q'), 'q', 100);
    const sql = db();
    const rows = await sql`
      SELECT b.id, b.name, b.email, b.phone, b.created_at,
        (SELECT p.name FROM orders o JOIN plans p ON p.id = o.plan_id
         WHERE o.buyer_id = b.id AND o.status = 'active' AND o.expires_at > now()
         ORDER BY o.created_at DESC LIMIT 1) AS active_plan,
        (SELECT o.expires_at FROM orders o
         WHERE o.buyer_id = b.id AND o.status = 'active' AND o.expires_at > now()
         ORDER BY o.created_at DESC LIMIT 1) AS active_expires_at
      FROM buyers b
      WHERE (${q} = '' OR b.name ILIKE '%' || ${q} || '%' OR b.email ILIKE '%' || ${q} || '%')
      ORDER BY b.created_at DESC`;
    return Response.json({ buyers: rows });
  } catch (err) {
    return jsonError(err);
  }
}
