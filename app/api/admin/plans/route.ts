// /api/admin/plans — admin: list (GET) and create (POST) plans.
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { parseBody, requireAdmin } from '@/lib/guard';
import { jsonError, reqString, reqInt, reqStringArray, slugify, bad } from '@/lib/validation';

function optBool(v: unknown, field: string): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'boolean') throw bad(`${field} must be a boolean.`);
  return v;
}

export async function GET() {
  try {
    await requireAdmin();
    const sql = db();
    const rows = await sql`
      SELECT id, slug, name, months, price_pkr, features, active, sort
      FROM plans ORDER BY sort ASC`;
    return Response.json({ plans: rows });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const body = await parseBody(req);
    const name = reqString(body.name, 'name', { min: 1, max: 120 });
    const slugRaw = body.slug === undefined || body.slug === null ? '' : reqString(body.slug, 'slug', { min: 1, max: 80 });
    const slug = slugRaw === '' ? slugify(name) : slugify(slugRaw);
    const months = reqInt(body.months, 'months', 1, 120);
    const price_pkr = reqInt(body.price_pkr, 'price_pkr', 0, 100_000_000);
    const features = reqStringArray(body.features, 'features');
    const active = optBool(body.active, 'active') ?? true;
    const sort = body.sort === undefined ? 0 : reqInt(body.sort, 'sort', -100000, 100000);

    const sql = db();
    const taken = await sql`SELECT id FROM plans WHERE slug = ${slug}`;
    if (taken.length > 0) throw bad('That slug is already taken.');

    const rows = await sql`
      INSERT INTO plans (slug, name, months, price_pkr, features, active, sort)
      VALUES (${slug}, ${name}, ${months}, ${price_pkr}, ${JSON.stringify(features)}::jsonb, ${active}, ${sort})
      RETURNING id, slug, name, months, price_pkr, features, active, sort`;
    await logAudit('admin', session.sub, 'plan_created', name);
    return Response.json({ plan: rows[0] }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
