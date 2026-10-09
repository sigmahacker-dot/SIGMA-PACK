// GET /api/my-tools — buyer: catalogue with credential flags (active sub required).
import { db } from '@/lib/db';
import { jsonError, ApiError } from '@/lib/validation';
import { expireStaleOrders, requireBuyer } from '@/lib/guard';

export async function GET() {
  try {
    const session = await requireBuyer();
    const sql = db();
    await expireStaleOrders(sql, session.sub);

    const sub = await sql`
      SELECT id FROM orders
      WHERE buyer_id = ${session.sub} AND status = 'active' AND expires_at > now()
      LIMIT 1`;
    if (sub.length === 0) {
      throw new ApiError(403, 'No active subscription.');
    }

    const rows = await sql`
      SELECT t.id, t.name, t.slug, t.category, t.description, t.icon_svg, t.url,
        EXISTS(SELECT 1 FROM tool_credentials tc WHERE tc.tool_id = t.id AND tc.buyer_id = ${session.sub}) AS has_credentials
      FROM tools t
      WHERE t.active = true
      ORDER BY t.sort ASC, t.name ASC`;
    return Response.json({ tools: rows, active: true });
  } catch (err) {
    return jsonError(err);
  }
}
