// POST /api/credentials/reveal — buyer: decrypt own credentials (active sub required).
import { db } from '@/lib/db';
import { decrypt } from '@/lib/crypto';
import { logAudit } from '@/lib/audit';
import { jsonError, reqString, ApiError } from '@/lib/validation';
import { expireStaleOrders, parseBody, requireBuyer, reqUuid } from '@/lib/guard';

export async function POST(req: Request) {
  try {
    const session = await requireBuyer();
    const body = await parseBody(req);
    const toolId = reqUuid(reqString(body.tool_id, 'tool_id'), 'tool_id');

    const sql = db();
    await expireStaleOrders(sql, session.sub);
    const sub = await sql`
      SELECT id FROM orders
      WHERE buyer_id = ${session.sub} AND status = 'active' AND expires_at > now()
      LIMIT 1`;
    if (sub.length === 0) {
      throw new ApiError(403, 'No active subscription.');
    }

    const rows = await sql`
      SELECT tc.label, tc.username_enc, tc.password_enc, tc.notes_enc, t.name AS tool_name
      FROM tool_credentials tc JOIN tools t ON t.id = tc.tool_id
      WHERE tc.tool_id = ${toolId} AND tc.buyer_id = ${session.sub}`;
    const row = rows[0] as {
      label: string; username_enc: string; password_enc: string; notes_enc: string; tool_name: string;
    } | undefined;
    if (!row) throw new ApiError(404, 'No credentials found for this tool.');

    // Never log plaintext.
    const username = decrypt(row.username_enc);
    const password = decrypt(row.password_enc);
    const notes = row.notes_enc ? decrypt(row.notes_enc) : '';
    await logAudit('buyer', session.sub, 'credentials_revealed', row.tool_name);

    return Response.json({
      tool_name: row.tool_name,
      label: row.label,
      username,
      password,
      notes,
    });
  } catch (err) {
    return jsonError(err);
  }
}
