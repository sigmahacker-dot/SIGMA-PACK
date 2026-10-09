// DELETE /api/admin/credentials/[id] — admin removes a credential row.
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { requireAdmin, reqUuid } from '@/lib/guard';
import { jsonError, ApiError } from '@/lib/validation';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdmin();
    const id = reqUuid(params.id);
    const sql = db();
    const rows = await sql`
      DELETE FROM tool_credentials tc USING tools t, buyers b
      WHERE tc.id = ${id} AND t.id = tc.tool_id AND b.id = tc.buyer_id
      RETURNING t.name AS tool_name, b.email AS buyer_email`;
    if (rows.length === 0) throw new ApiError(404, 'Not found.');
    const r = rows[0] as { tool_name: string; buyer_email: string };
    await logAudit('admin', session.sub, 'credential_deleted', `${r.tool_name} → ${r.buyer_email}`);
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
