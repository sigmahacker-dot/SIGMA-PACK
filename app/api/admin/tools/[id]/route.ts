// /api/admin/tools/[id] — admin: update (PATCH) and delete (DELETE) a tool.
import { db } from '@/lib/db';
import { letterIcon } from '@/lib/icons';
import { logAudit } from '@/lib/audit';
import { parseBody, requireAdmin, reqUuid } from '@/lib/guard';
import { jsonError, reqString, reqInt, optString, bad, ApiError } from '@/lib/validation';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdmin();
    const id = reqUuid(params.id);
    const body = await parseBody(req);
    const sql = db();

    const existing = await sql`SELECT id, name FROM tools WHERE id = ${id}`;
    if (existing.length === 0) throw new ApiError(404, 'Not found.');
    const oldName = (existing[0] as { name: string }).name;

    const updates: string[] = [];
    const values: unknown[] = [];
    const push = (col: string, val: unknown) => {
      updates.push(`${col} = $${updates.length + 2}`);
      values.push(val);
    };

    let iconRegen = false;
    if (body.name !== undefined) {
      const name = reqString(body.name, 'name', { min: 1, max: 120 });
      push('name', name);
      iconRegen = name !== oldName;
    }
    if (body.category !== undefined) push('category', reqString(body.category, 'category', { min: 1, max: 80 }));
    if (body.description !== undefined) push('description', optString(body.description, 'description', 2000));
    if (body.url !== undefined) push('url', optString(body.url, 'url', 500));
    if (body.active !== undefined) {
      if (typeof body.active !== 'boolean') throw bad('active must be a boolean.');
      push('active', body.active);
    }
    if (body.sort !== undefined) push('sort', reqInt(body.sort, 'sort', -100000, 100000));
    if (iconRegen && body.name !== undefined) push('icon_svg', letterIcon(String(body.name)));

    if (updates.length === 0) throw bad('Nothing to update.');

    const setClause = updates.join(', ');
    // Column names are fixed literals above; values are parameterized.
    const rows = await sql.query(
      `UPDATE tools SET ${setClause} WHERE id = $1 RETURNING id, name, slug, category, description, icon_svg, url, active, sort`,
      [id, ...values],
    );
    await logAudit('admin', session.sub, 'tool_updated', (rows[0] as { name: string }).name);
    return Response.json({ tool: rows[0] });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdmin();
    const id = reqUuid(params.id);
    const sql = db();
    const rows = await sql`DELETE FROM tools WHERE id = ${id} RETURNING name`;
    if (rows.length === 0) throw new ApiError(404, 'Not found.');
    await logAudit('admin', session.sub, 'tool_deleted', (rows[0] as { name: string }).name);
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
