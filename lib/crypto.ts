// AES-256-GCM encryption for stored buyer tool credentials.
// Key: CREDENTIALS_KEY env var, 32-byte hex string. Values are base64(iv|ciphertext|tag).
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

function key(): Buffer {
  const hex = process.env.CREDENTIALS_KEY;
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('CREDENTIALS_KEY must be a 64-char hex string (32 bytes).');
  }
  return Buffer.from(hex, 'hex');
}

export function encrypt(plaintext: string): string {
  const k = key();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', k, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ct, tag]).toString('base64');
}

export function decrypt(blob: string): string {
  const k = key();
  const raw = Buffer.from(blob, 'base64');
  if (raw.length < 12 + 16 + 1) throw new Error('Malformed encrypted value.');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(raw.length - 16);
  const ct = raw.subarray(12, raw.length - 16);
  const decipher = createDecipheriv('aes-256-gcm', k, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}
