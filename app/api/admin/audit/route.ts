// GET /api/admin/audit?limit= — admin: audit log rows, newest first.
import { db } from '@/lib/db';
import { jsonError, bad } from '@/lib/validation';
import { requireAdmin } from '@/lib/guard';

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const raw = url.searchParams.get('limit');
    let limit = 100;
    if (raw !== null) {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1 || n > 500) {
        throw bad('limit must be an integer 1–500.');
      }
      limit = n;
    }
    const sql = db();
    const rows = await sql`
      SELECT id, actor_type, actor_id, action, detail, created_at
      FROM audit_log ORDER BY created_at DESC LIMIT ${limit}`;
    return Response.json({ audit: rows });
  } catch (err) {
    return jsonError(err);
  }
}
