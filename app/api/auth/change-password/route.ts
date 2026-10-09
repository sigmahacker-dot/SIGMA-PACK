// POST /api/auth/change-password — buyer changes own password.
import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { parseBody, requireBuyer } from '@/lib/guard';
import { jsonError, reqPassword, ApiError } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const session = await requireBuyer();
    const body = await parseBody(req);
    const current = typeof body.current_password === 'string' ? body.current_password : '';
    const next = reqPassword(body.new_password, 8);

    const sql = db();
    const rows = await sql`SELECT password_hash FROM buyers WHERE id = ${session.sub}`;
    const row = rows[0] as { password_hash: string } | undefined;
    if (!row || !(await verifyPassword(current, row.password_hash))) {
      throw new ApiError(401, 'Current password is incorrect.');
    }
    const password_hash = await hashPassword(next);
    await sql`UPDATE buyers SET password_hash = ${password_hash} WHERE id = ${session.sub}`;
    await logAudit('buyer', session.sub, 'buyer_password_changed');
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
