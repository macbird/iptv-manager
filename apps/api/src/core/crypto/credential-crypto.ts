import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_SALT = 'client-manager-server-credentials';

function resolveEncryptionKey(): Buffer {
  const secret = process.env.CREDENTIALS_ENCRYPTION_KEY ?? process.env.JWT_SECRET ?? 'dev-only-change-me';
  return scryptSync(secret, KEY_SALT, 32);
}

/**
 * Encrypts a reversible secret (e.g. panel password) for storage.
 */
export function encryptCredential(plainText: string): string {
  const key = resolveEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

/**
 * Decrypts a value previously stored with {@link encryptCredential}.
 */
export function decryptCredential(payload: string): string {
  const key = resolveEncryptionKey();
  const buffer = Buffer.from(payload, 'base64');
  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

/**
 * Decrypts a stored credential, returning empty string when decryption fails.
 */
export function safeDecryptCredential(payload: string | null | undefined): string {
  if (!payload) return '';
  try {
    return decryptCredential(payload);
  } catch {
    return '';
  }
}
