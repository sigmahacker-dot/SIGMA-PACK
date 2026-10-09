// GET /api/tools?q=&category= — public catalogue (active tools only).
import { db } from '@/lib/db';
import { jsonError, optString } from '@/lib/validation';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = optString(url.searchParams.get('q'), 'q', 100);
    const category = optString(url.searchParams.get('category'), 'category', 100);
    const sql = db();
    const rows = await sql`
      SELECT id, name, slug, category, description, icon_svg, url
      FROM tools
      WHERE active = true
        AND (${q} = '' OR name ILIKE '%' || ${q} || '%' OR description ILIKE '%' || ${q} || '%')
        AND (${category} = '' OR category = ${category})
      ORDER BY sort ASC, name ASC
      LIMIT 500`;
    return Response.json({ tools: rows });
  } catch (err) {
    return jsonError(err);
  }
}
