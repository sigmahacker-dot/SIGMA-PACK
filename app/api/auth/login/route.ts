// POST /api/auth/login — buyer sign-in. Generic 401, no enumeration.
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyPassword, signSession, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { parseBody } from '@/lib/guard';
import {
  ApiError,
  jsonError,
  reqEmail,
  rateLimit,
  clientIp,
} from '@/lib/validation';

const GENERIC = 'Invalid email or password.';

export async function POST(req: Request) {
  try {
    const body = await parseBody(req);
    const email = reqEmail(body.email);
    if (!rateLimit(`login:${clientIp(req)}:${email}`, 10, 10 * 60 * 1000)) {
      throw new ApiError(429, 'Too many attempts. Try again later.');
    }
    const password = typeof body.password === 'string' ? body.password : '';
    if (password.length === 0) throw new ApiError(401, GENERIC);

    const sql = db();
    const rows = await sql`SELECT id, name, email, password_hash FROM buyers WHERE email = ${email}`;
    const row = rows[0] as { id: string; name: string; email: string; password_hash: string } | undefined;
    if (!row || !(await verifyPassword(password, row.password_hash))) {
      throw new ApiError(401, GENERIC);
    }

    const token = await signSession({ sub: row.id, role: 'buyer', name: row.name });
    cookies().set(SESSION_COOKIE, token, sessionCookieOptions());
    await logAudit('buyer', row.id, 'buyer_login', email);

    return Response.json({ user: { id: row.id, name: row.name, email: row.email } });
  } catch (err) {
    return jsonError(err);
  }
}
