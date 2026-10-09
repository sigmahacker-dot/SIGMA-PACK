// POST /api/admin/buyers/[id]/reset-password — admin resets a buyer password.
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { parseBody, requireAdmin, reqUuid } from '@/lib/guard';
import { jsonError, reqPassword, ApiError } from '@/lib/validation';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdmin();
    const id = reqUuid(params.id);
    const body = await parseBody(req);
    const password = reqPassword(body.password, 8);

    const sql = db();
    const rows = await sql`SELECT id, email FROM buyers WHERE id = ${id}`;
    if (rows.length === 0) throw new ApiError(404, 'Not found.');

    const password_hash = await hashPassword(password);
    await sql`UPDATE buyers SET password_hash = ${password_hash} WHERE id = ${id}`;
    await logAudit('admin', session.sub, 'buyer_password_reset', (rows[0] as { email: string }).email);
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
