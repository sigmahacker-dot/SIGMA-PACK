// GET /api/auth/me — current session user (buyer or admin).
import { db } from '@/lib/db';
import { jsonError } from '@/lib/validation';
import { requireSession } from '@/lib/guard';

export async function GET() {
  try {
    const session = await requireSession();
    const sql = db();
    if (session.role === 'admin') {
      const rows = await sql`SELECT id, username AS name, email FROM admins WHERE id = ${session.sub}`;
      const row = rows[0] as { id: string; name: string; email: string } | undefined;
      if (!row) throw new Error('stale session');
      return Response.json({ user: { id: row.id, name: row.name, email: row.email, role: 'admin' } });
    }
    const rows = await sql`SELECT id, name, email FROM buyers WHERE id = ${session.sub}`;
    const row = rows[0] as { id: string; name: string; email: string } | undefined;
    if (!row) throw new Error('stale session');
    return Response.json({ user: { id: row.id, name: row.name, email: row.email, role: 'buyer' } });
  } catch (err) {
    return jsonError(err);
  }
}
