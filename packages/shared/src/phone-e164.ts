import { z } from 'zod';

/**
 * Normalizes Brazilian phone numbers to E.164 digits (55 + DDD + number).
 */
export function normalizePhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

/**
 * Returns true when the value is a valid Brazilian E.164 digit string (55 + 10 or 11 national digits).
 */
export function isValidBrazilPhoneE164(phone: string): boolean {
  const normalized = normalizePhoneE164(phone);
  if (!normalized.startsWith('55')) return false;
  const national = normalized.slice(2);
  return national.length === 10 || national.length === 11;
}

function preprocessPhoneValue(val: unknown): string {
  return normalizePhoneE164(String(val ?? ''));
}

const phoneE164String = z
  .string()
  .min(1, 'Informe um telefone válido com DDD')
  .refine(isValidBrazilPhoneE164, 'Informe um telefone válido com DDD');

/** Required phone field (customer, etc.). */
export const requiredPhoneE164Schema = z.preprocess(preprocessPhoneValue, phoneE164String);

/** Optional phone; empty input becomes undefined. */
export const optionalPhoneE164Schema = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    return preprocessPhoneValue(val);
  },
  phoneE164String.optional(),
);

/** Optional nullable phone (admin account update). */
export const nullableOptionalPhoneE164Schema = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return null;
    return preprocessPhoneValue(val);
  },
  z.union([phoneE164String, z.null()]).optional(),
);
