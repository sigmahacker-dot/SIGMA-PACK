// POST /api/admin/setup — one-time first admin. 404 once any admin exists.
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { parseBody } from '@/lib/guard';
import {
  ApiError,
  jsonError,
  reqString,
  reqEmail,
  reqPassword,
  rateLimit,
  clientIp,
} from '@/lib/validation';

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,30}$/;

export async function POST(req: Request) {
  try {
    if (!rateLimit(`admin-setup:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
      throw new ApiError(429, 'Too many attempts. Try again later.');
    }
    const sql = db();
    const count = await sql`SELECT COUNT(*)::int AS c FROM admins`;
    if ((count[0] as { c: number }).c > 0) {
      throw new ApiError(404, 'Not found.');
    }

    const body = await parseBody(req);
    const username = reqString(body.username, 'username', { min: 3, max: 30 });
    if (!USERNAME_RE.test(username)) {
      throw new ApiError(400, 'username may only contain letters, numbers, _ and -.');
    }
    const email = reqEmail(body.email);
    const password = reqPassword(body.password, 8);

    const password_hash = await hashPassword(password);
    const rows = await sql`
      INSERT INTO admins (username, email, password_hash)
      VALUES (${username}, ${email}, ${password_hash})
      RETURNING id`;
    const id = (rows[0] as { id: string }).id;
    await logAudit('admin', id, 'admin_setup', username);

    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
