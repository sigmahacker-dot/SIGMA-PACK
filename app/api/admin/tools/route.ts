// /api/admin/tools — admin: list (GET) and create (POST) tools.
import { db } from '@/lib/db';
import { letterIcon } from '@/lib/icons';
import { logAudit } from '@/lib/audit';
import { parseBody, requireAdmin } from '@/lib/guard';
import { jsonError, reqString, reqInt, optString, slugify, bad } from '@/lib/validation';

function optBool(v: unknown, field: string): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'boolean') throw bad(`${field} must be a boolean.`);
  return v;
}

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const q = optString(url.searchParams.get('q'), 'q', 100);
    const category = optString(url.searchParams.get('category'), 'category', 100);
    const active = optString(url.searchParams.get('active'), 'active', 5);
    if (active !== '' && active !== 'true' && active !== 'false') {
      throw bad('active must be true or false.');
    }
    const sql = db();
    const rows = await sql`
      SELECT id, name, slug, category, description, icon_svg, url, active, sort
      FROM tools
      WHERE (${q} = '' OR name ILIKE '%' || ${q} || '%' OR description ILIKE '%' || ${q} || '%')
        AND (${category} = '' OR category = ${category})
        AND (${active} = '' OR active = (${active} = 'true'))
      ORDER BY sort ASC, name ASC`;
    return Response.json({ tools: rows });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const body = await parseBody(req);
    const name = reqString(body.name, 'name', { min: 1, max: 120 });
    const category = reqString(body.category, 'category', { min: 1, max: 80 });
    const description = optString(body.description, 'description', 2000);
    const url = optString(body.url, 'url', 500);
    const active = optBool(body.active, 'active') ?? true;
    const sort = body.sort === undefined ? 0 : reqInt(body.sort, 'sort', -100000, 100000);

    const sql = db();
    let slug = slugify(name);
    const taken = await sql`SELECT id FROM tools WHERE slug = ${slug}`;
    if (taken.length > 0) {
      let n = 2;
      while (n < 100) {
        const candidate = `${slug}-${n}`;
        const r = await sql`SELECT id FROM tools WHERE slug = ${candidate}`;
        if (r.length === 0) { slug = candidate; break; }
        n++;
      }
    }

    const rows = await sql`
      INSERT INTO tools (name, slug, category, description, icon_svg, url, active, sort)
      VALUES (${name}, ${slug}, ${category}, ${description}, ${letterIcon(name)}, ${url}, ${active}, ${sort})
      RETURNING id, name, slug, category, description, icon_svg, url, active, sort`;
    await logAudit('admin', session.sub, 'tool_created', name);
    return Response.json({ tool: rows[0] }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
