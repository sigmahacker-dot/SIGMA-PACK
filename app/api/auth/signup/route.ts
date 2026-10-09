// POST /api/auth/signup — buyer registration.
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { hashPassword, signSession, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { parseBody } from '@/lib/guard';
import {
  ApiError,
  jsonError,
  reqString,
  reqEmail,
  reqPassword,
  optString,
  rateLimit,
  clientIp,
} from '@/lib/validation';

export async function POST(req: Request) {
  try {
    if (!rateLimit(`signup:${clientIp(req)}`, 20, 60 * 60 * 1000)) {
      throw new ApiError(429, 'Too many signups. Try again later.');
    }
    const body = await parseBody(req);
    const name = reqString(body.name, 'name', { min: 2, max: 60 });
    const email = reqEmail(body.email);
    const phone = optString(body.phone, 'phone', 20);
    const password = reqPassword(body.password, 8);

    const sql = db();
    const existing = await sql`SELECT id FROM buyers WHERE email = ${email}`;
    if (existing.length > 0) {
      throw new ApiError(409, 'This email is already registered.');
    }

    const password_hash = await hashPassword(password);
    const rows = await sql`
      INSERT INTO buyers (name, email, phone, password_hash)
      VALUES (${name}, ${email}, ${phone === '' ? null : phone}, ${password_hash})
      RETURNING id, name, email`;

    const user = rows[0] as { id: string; name: string; email: string };
    const token = await signSession({ sub: user.id, role: 'buyer', name: user.name });
    cookies().set(SESSION_COOKIE, token, sessionCookieOptions());
    await logAudit('buyer', user.id, 'buyer_signup', email);

    return Response.json({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
