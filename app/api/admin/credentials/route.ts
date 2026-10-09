// /api/admin/credentials — admin: list (GET) and upsert (POST) buyer credentials.
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import { logAudit } from '@/lib/audit';
import { parseBody, requireAdmin, reqUuid } from '@/lib/guard';
import { jsonError, reqString, optString, bad, ApiError } from '@/lib/validation';

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function optUuid(v: string | null, field: string): string {
  if (v === null || v === '') return '';
  if (!UUID_RE.test(v)) throw bad(`${field} must be a valid UUID.`);
  return v;
}

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const buyer_id = optUuid(url.searchParams.get('buyer_id'), 'buyer_id');
    const tool_id = optUuid(url.searchParams.get('tool_id'), 'tool_id');
    const sql = db();
    const rows = await sql`
      SELECT tc.id, tc.tool_id, tc.buyer_id, tc.label, tc.created_at,
             b.email AS buyer_email, b.name AS buyer_name, t.name AS tool_name,
             true AS has_values
      FROM tool_credentials tc
      JOIN buyers b ON b.id = tc.buyer_id
      JOIN tools t ON t.id = tc.tool_id
      WHERE (${buyer_id} = '' OR tc.buyer_id = ${buyer_id}::uuid)
        AND (${tool_id} = '' OR tc.tool_id = ${tool_id}::uuid)
      ORDER BY tc.created_at DESC`;
    return Response.json({ credentials: rows });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const body = await parseBody(req);
    const buyer_id = reqUuid(reqString(body.buyer_id, 'buyer_id'), 'buyer_id');
    const tool_id = reqUuid(reqString(body.tool_id, 'tool_id'), 'tool_id');
    const label = optString(body.label, 'label', 120);
    const username = reqString(body.username, 'username', { min: 1, max: 500 });
    const password = reqString(body.password, 'password', { min: 1, max: 500 });
    const notes = optString(body.notes, 'notes', 2000);

    const sql = db();
    const buyerRows = await sql`SELECT id, email FROM buyers WHERE id = ${buyer_id}`;
    if (buyerRows.length === 0) throw new ApiError(404, 'Buyer not found.');
    const toolRows = await sql`SELECT id, name FROM tools WHERE id = ${tool_id}`;
    if (toolRows.length === 0) throw new ApiError(404, 'Tool not found.');

    const username_enc = encrypt(username);
    const password_enc = encrypt(password);
    const notes_enc = notes === '' ? '' : encrypt(notes);

    await sql`
      INSERT INTO tool_credentials (tool_id, buyer_id, label, username_enc, password_enc, notes_enc)
      VALUES (${tool_id}, ${buyer_id}, ${label}, ${username_enc}, ${password_enc}, ${notes_enc})
      ON CONFLICT (tool_id, buyer_id) DO UPDATE SET
        label = EXCLUDED.label,
        username_enc = EXCLUDED.username_enc,
        password_enc = EXCLUDED.password_enc,
        notes_enc = EXCLUDED.notes_enc`;
    await logAudit(
      'admin', session.sub, 'credential_upserted',
      `${(toolRows[0] as { name: string }).name} → ${(buyerRows[0] as { email: string }).email}`,
    );
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
