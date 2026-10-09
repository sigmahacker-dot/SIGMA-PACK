// Session guards for API routes. Throw ApiError (401/403/404) and let
// jsonError() translate. Every protected route must call these itself.
import { ApiError, reqString } from './validation';
import { getSession, type Role, type SessionPayload } from './auth';

export async function requireSession(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) throw new ApiError(401, 'Not signed in.');
  return s;
}

export async function requireRole(role: Role): Promise<SessionPayload> {
  const s = await requireSession();
  if (s.role !== role) throw new ApiError(403, 'Forbidden.');
  return s;
}

export const requireBuyer = () => requireRole('buyer');
export const requireAdmin = () => requireRole('admin');

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** Validates a UUID path param; 404 on malformed or it leaks nothing. */
export function reqUuid(v: unknown, field = 'id'): string {
  const s = reqString(v, field, { max: 64 });
  if (!UUID_RE.test(s)) throw new ApiError(404, 'Not found.');
  return s;
}

/** Parses an optional JSON body. 400 on malformed JSON. */
export async function parseBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    if (b === null || typeof b !== 'object' || Array.isArray(b)) {
      throw new ApiError(400, 'Invalid JSON body.');
    }
    return b as Record<string, unknown>;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(400, 'Invalid JSON body.');
  }
}

/** Lazily expire a buyer's stale active orders. */
export async function expireStaleOrders(
  sql: ReturnType<typeof import('./db').db>,
  buyerId: string,
): Promise<void> {
  await sql`UPDATE orders SET status = 'expired'
    WHERE buyer_id = ${buyerId} AND status = 'active' AND expires_at < now()`;
}

/** Fetches the singleton settings row (id=1), creating defaults if missing. */
export async function getSettings(
  sql: ReturnType<typeof import('./db').db>,
): Promise<{
  site_name: string;
  whatsapp_number: string;
  jazzcash_number: string;
  easypaisa_number: string;
  support_text: string;
}> {
  const rows = await sql`SELECT site_name, whatsapp_number, jazzcash_number, easypaisa_number, support_text
    FROM settings WHERE id = 1`;
  const r = rows[0] as Record<string, string> | undefined;
  return {
    site_name: r?.site_name ?? 'Sigma Pack',
    whatsapp_number: r?.whatsapp_number ?? '',
    jazzcash_number: r?.jazzcash_number ?? '',
    easypaisa_number: r?.easypaisa_number ?? '',
    support_text: r?.support_text ?? '',
  };
}
