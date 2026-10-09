// /api/admin/settings — admin: read (GET) and update (PUT) site settings.
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { parseBody, requireAdmin, getSettings } from '@/lib/guard';
import { jsonError, optString, bad } from '@/lib/validation';

const FIELDS = ['site_name', 'whatsapp_number', 'jazzcash_number', 'easypaisa_number', 'support_text'] as const;

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ settings: await getSettings(db()) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireAdmin();
    const body = await parseBody(req);
    const updates: { col: string; val: string }[] = [];
    for (const f of FIELDS) {
      if (body[f] !== undefined) {
        const max = f === 'support_text' ? 2000 : f === 'site_name' ? 120 : 40;
        updates.push({ col: f, val: optString(body[f], f, max) });
      }
    }
    if (updates.length === 0) throw bad('Nothing to update.');

    const sql = db();
    const setClause = updates.map((u, i) => `${u.col} = $${i + 1}`).join(', ');
    // Columns come from a fixed literal list; values are parameterized.
    await sql.query(`UPDATE settings SET ${setClause} WHERE id = 1`, updates.map((u) => u.val));
    await logAudit('admin', session.sub, 'settings_updated', updates.map((u) => u.col).join(','));
    return Response.json({ settings: await getSettings(sql) });
  } catch (err) {
    return jsonError(err);
  }
}
