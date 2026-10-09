// /api/admin/buyers/[id] — admin: delete a buyer.
// Orders and tool credentials reference buyers with ON DELETE CASCADE,
// so deleting a buyer removes their orders and assigned credentials too.
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { requireAdmin, reqUuid } from '@/lib/guard';
import { jsonError, ApiError } from '@/lib/validation';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdmin();
    const id = reqUuid(params.id);
    const sql = db();
    const rows = await sql`SELECT id, email FROM buyers WHERE id = ${id}`;
    if (rows.length === 0) throw new ApiError(404, 'Buyer not found.');
    await sql`DELETE FROM buyers WHERE id = ${id}`;
    await logAudit('admin', session.sub, 'buyer_deleted', (rows[0] as { email: string }).email);
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
