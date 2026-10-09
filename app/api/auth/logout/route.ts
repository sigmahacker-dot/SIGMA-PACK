// POST /api/auth/logout — clears the session cookie (buyer + admin).
import { cookies } from 'next/headers';
import { sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth';
import { jsonError } from '@/lib/validation';

export async function POST() {
  try {
    cookies().set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
