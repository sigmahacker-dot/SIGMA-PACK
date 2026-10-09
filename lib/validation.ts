// Strict input validation for API routes. Throw bad(msg) on failure.
export class ApiError extends Error {
  status: number;
  constructor(status: number, msg: string) {
    super(msg);
    this.status = status;
  }
}
export const bad = (msg: string) => new ApiError(400, msg);

export function reqString(v: unknown, field: string, opts?: { min?: number; max?: number }): string {
  if (typeof v !== 'string') throw bad(`${field} must be a string.`);
  const s = v.trim();
  if (opts?.min && s.length < opts.min) throw bad(`${field} is too short.`);
  if (opts?.max && s.length > opts.max) throw bad(`${field} is too long.`);
  if (s.length === 0) throw bad(`${field} is required.`);
  return s;
}

export function optString(v: unknown, field: string, max = 500): string {
  if (v === undefined || v === null) return '';
  if (typeof v !== 'string') throw bad(`${field} must be a string.`);
  const s = v.trim();
  if (s.length > max) throw bad(`${field} is too long.`);
  return s;
}

export function reqEmail(v: unknown): string {
  const s = reqString(v, 'email', { min: 5, max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw bad('email is not valid.');
  return s;
}

export function reqPassword(v: unknown, min = 8): string {
  if (typeof v !== 'string' || v.length < min) throw bad(`password must be at least ${min} characters.`);
  if (v.length > 128) throw bad('password is too long.');
  return v;
}

export function reqInt(v: unknown, field: string, min = 0, max = 1_000_000): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw bad(`${field} must be an integer ${min}–${max}.`);
  return n;
}

export function reqStringArray(v: unknown, field: string, maxItems = 50, maxLen = 200): string[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) throw bad(`${field} must be an array of strings.`);
  if (v.length > maxItems) throw bad(`${field} has too many items.`);
  return v.map((f, i) => {
    if (typeof f !== 'string') throw bad(`${field}[${i}] must be a string.`);
    const s = f.trim();
    if (s.length === 0 || s.length > maxLen) throw bad(`${field}[${i}] must be 1–${maxLen} characters.`);
    return s;
  });
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64) || 'tool';
}

// Simple in-memory rate limiter (per IP + key). Fine at this scale.
const hits = new Map<string, number[]>();
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  return true;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function jsonError(err: unknown): Response {
  if (err instanceof ApiError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error('API error:', err instanceof Error ? err.message : err);
  return Response.json({ error: 'Something went wrong.' }, { status: 500 });
}
