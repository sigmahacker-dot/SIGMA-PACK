// PUT /api/admin/account — admin updates own username/email/password.
// current_password is ALWAYS required.
import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { parseBody, requireAdmin } from '@/lib/guard';
import { jsonError, reqString, reqEmail, reqPassword, bad, ApiError } from '@/lib/validation';

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,30}$/;

export async function PUT(req: Request) {
  try {
    const session = await requireAdmin();
    const body = await parseBody(req);
    const current = typeof body.current_password === 'string' ? body.current_password : '';
    if (current.length === 0) throw bad('current_password is required.');

    const sql = db();
    const rows = await sql`SELECT id, username, email, password_hash FROM admins WHERE id = ${session.sub}`;
    const admin = rows[0] as { id: string; username: string; email: string; password_hash: string } | undefined;
    if (!admin) throw new ApiError(401, 'Not signed in.');
    if (!(await verifyPassword(current, admin.password_hash))) {
      throw new ApiError(401, 'Current password is incorrect.');
    }

    const changes: string[] = [];
    if (body.username !== undefined) {
      const username = reqString(body.username, 'username', { min: 3, max: 30 });
      if (!USERNAME_RE.test(username)) throw bad('username may only contain letters, numbers, _ and -.');
      const dup = await sql`SELECT id FROM admins WHERE username = ${username} AND id <> ${session.sub}`;
      if (dup.length > 0) throw new ApiError(409, 'That username is already taken.');
      await sql`UPDATE admins SET username = ${username} WHERE id = ${session.sub}`;
      changes.push('username');
    }
    if (body.email !== undefined) {
      const email = reqEmail(body.email);
      const dup = await sql`SELECT id FROM admins WHERE email = ${email} AND id <> ${session.sub}`;
      if (dup.length > 0) throw new ApiError(409, 'That email is already taken.');
      await sql`UPDATE admins SET email = ${email} WHERE id = ${session.sub}`;
      changes.push('email');
    }
    if (body.new_password !== undefined) {
      const password_hash = await hashPassword(reqPassword(body.new_password, 8));
      await sql`UPDATE admins SET password_hash = ${password_hash} WHERE id = ${session.sub}`;
      changes.push('password');
    }
    if (changes.length === 0) throw bad('Nothing to update.');

    await logAudit('admin', session.sub, 'admin_account_updated', changes.join(','));
    const fresh = await sql`SELECT id, username, email FROM admins WHERE id = ${session.sub}`;
    const f = fresh[0] as { id: string; username: string; email: string };
    return Response.json({ user: { id: f.id, name: f.username, email: f.email, role: 'admin' } });
  } catch (err) {
    return jsonError(err);
  }
}
