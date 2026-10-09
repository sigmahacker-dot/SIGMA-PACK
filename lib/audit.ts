// Best-effort audit logging. Never throws; never logs secrets.
import { db } from './db';

export async function logAudit(
  actor_type: string,
  actor_id: string,
  action: string,
  detail?: string,
): Promise<void> {
  try {
    await db()`INSERT INTO audit_log (actor_type, actor_id, action, detail)
      VALUES (${actor_type}, ${actor_id}, ${action}, ${detail ?? ''})`;
  } catch {
    // best-effort: audit failure must never break the request
  }
}
