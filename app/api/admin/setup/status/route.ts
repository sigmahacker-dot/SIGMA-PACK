// GET /api/admin/setup/status — public: is first-time setup needed?
import { db } from '@/lib/db';
import { jsonError } from '@/lib/validation';

export async function GET() {
  try {
    const sql = db();
    const rows = await sql`SELECT COUNT(*)::int AS c FROM admins`;
    return Response.json({ needsSetup: (rows[0] as { c: number }).c === 0 });
  } catch (err) {
    return jsonError(err);
  }
}
