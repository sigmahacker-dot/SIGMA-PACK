// GET /api/plans — public pricing plans.
import { db } from '@/lib/db';
import { jsonError } from '@/lib/validation';

export async function GET() {
  try {
    const sql = db();
    const rows = await sql`
      SELECT id, slug, name, months, price_pkr, features, sort
      FROM plans WHERE active = true ORDER BY sort ASC`;
    return Response.json({ plans: rows });
  } catch (err) {
    return jsonError(err);
  }
}
