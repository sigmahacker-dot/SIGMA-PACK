// /api/admin/plans/[id] — admin: update (PATCH) and delete (DELETE) a plan.
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { parseBody, requireAdmin, reqUuid } from '@/lib/guard';
import { jsonError, reqString, reqInt, reqStringArray, slugify, bad, ApiError } from '@/lib/validation';

function optBool(v: unknown, field: string): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'boolean') throw bad(`${field} must be a boolean.`);
  return v;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdmin();
    const id = reqUuid(params.id);
    const body = await parseBody(req);
    const sql = db();

    const existing = await sql`SELECT id FROM plans WHERE id = ${id}`;
    if (existing.length === 0) throw new ApiError(404, 'Not found.');

    const updates: string[] = [];
    const values: unknown[] = [];
    const push = (col: string, val: unknown) => {
      updates.push(`${col} = $${updates.length + 2}`);
      values.push(val);
    };

    if (body.slug !== undefined) {
      const slug = slugify(reqString(body.slug, 'slug', { min: 1, max: 80 }));
      const taken = await sql`SELECT id FROM plans WHERE slug = ${slug} AND id <> ${id}`;
      if (taken.length > 0) throw bad('That slug is already taken.');
      push('slug', slug);
    }
    let planName = '';
    if (body.name !== undefined) {
      planName = reqString(body.name, 'name', { min: 1, max: 120 });
      push('name', planName);
    }
    if (body.months !== undefined) push('months', reqInt(body.months, 'months', 1, 120));
    if (body.price_pkr !== undefined) push('price_pkr', reqInt(body.price_pkr, 'price_pkr', 0, 100_000_000));
    if (body.features !== undefined) {
      push('features', JSON.stringify(reqStringArray(body.features, 'features')));
    }
    if (body.active !== undefined) push('active', optBool(body.active, 'active'));
    if (body.sort !== undefined) push('sort', reqInt(body.sort, 'sort', -100000, 100000));

    if (updates.length === 0) throw bad('Nothing to update.');

    // features value is pushed as a JSON string and cast to jsonb.
    const setClause = updates
      .map((u, i) => (u.startsWith('features =') ? `features = $${i + 2}::jsonb` : u))
      .join(', ');
    const rows = await sql.query(
      `UPDATE plans SET ${setClause} WHERE id = $1 RETURNING id, slug, name, months, price_pkr, features, active, sort`,
      [id, ...values],
    );
    await logAudit('admin', session.sub, 'plan_updated', planName || (rows[0] as { name: string }).name);
    return Response.json({ plan: rows[0] });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdmin();
    const id = reqUuid(params.id);
    const sql = db();
    const refs = await sql`SELECT COUNT(*)::int AS c FROM orders WHERE plan_id = ${id}`;
    if ((refs[0] as { c: number }).c > 0) {
      throw new ApiError(409, 'This plan has orders and cannot be deleted.');
    }
    const rows = await sql`DELETE FROM plans WHERE id = ${id} RETURNING name`;
    if (rows.length === 0) throw new ApiError(404, 'Not found.');
    await logAudit('admin', session.sub, 'plan_deleted', (rows[0] as { name: string }).name);
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
