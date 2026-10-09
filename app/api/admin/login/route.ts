// POST /api/admin/login — admin sign-in (username OR email). Generic 401.
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyPassword, signSession, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { parseBody } from '@/lib/guard';
import { ApiError, jsonError, reqString, rateLimit, clientIp } from '@/lib/validation';

const GENERIC = 'Invalid credentials.';

export async function POST(req: Request) {
  try {
    if (!rateLimit(`admin-login:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
      throw new ApiError(429, 'Too many attempts. Try again later.');
    }
    const body = await parseBody(req);
    const identifier = reqString(body.identifier, 'identifier', { min: 1, max: 254 });
    const password = typeof body.password === 'string' ? body.password : '';
    if (password.length === 0) throw new ApiError(401, GENERIC);

    const sql = db();
    const rows = await sql`
      SELECT id, username, email, password_hash FROM admins
      WHERE username = ${identifier} OR email = ${identifier.toLowerCase()}`;
    const row = rows[0] as { id: string; username: string; email: string; password_hash: string } | undefined;
    if (!row || !(await verifyPassword(password, row.password_hash))) {
      throw new ApiError(401, GENERIC);
    }

    const token = await signSession({ sub: row.id, role: 'admin', name: row.username });
    cookies().set(SESSION_COOKIE, token, sessionCookieOptions());
    await logAudit('admin', row.id, 'admin_login', row.username);

    return Response.json({ user: { id: row.id, name: row.username, email: row.email, role: 'admin' } });
  } catch (err) {
    return jsonError(err);
  }
}
