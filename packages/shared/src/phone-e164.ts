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
 * Builds Brazilian mobile phone variants for WhatsApp pairing (with/without 9th digit).
 */
export function buildBrazilPairingPhoneCandidates(phone: string): string[] {
  const normalized = normalizePhoneE164(phone);
  if (!normalized.startsWith('55')) {
    return normalized ? [normalized] : [];
  }

  const national = normalized.slice(2);
  const candidates: string[] = [];

  const push = (value: string) => {
    if (!candidates.includes(value)) {
      candidates.push(value);
    }
  };

  push(normalized);

  if (national.length === 11 && national[2] === '9') {
    push(`55${national.slice(0, 2)}${national.slice(3)}`);
  }

  if (national.length === 10 && ['6', '7', '8', '9'].includes(national[2] ?? '')) {
    push(`55${national.slice(0, 2)}9${national.slice(2)}`);
  }

  return candidates;
}

/**
 * Orders pairing candidates so 11-digit mobile numbers (with 9) are tried first.
 */
export function orderBrazilPairingPhoneCandidates(phone: string): string[] {
  const candidates = buildBrazilPairingPhoneCandidates(phone);

  return [...candidates].sort((left, right) => {
    const leftNational = left.startsWith('55') ? left.slice(2).length : left.length;
    const rightNational = right.startsWith('55') ? right.slice(2).length : right.length;

    if (leftNational === 11 && rightNational === 10) {
      return -1;
    }

    if (leftNational === 10 && rightNational === 11) {
      return 1;
    }

    return 0;
  });
}

/**
 * Formats a Brazilian E.164 phone for display (e.g. +55 (35) 99984-1521).
 */
export function formatBrazilPhoneForDisplay(phone: string): string {
  const digits = normalizePhoneE164(phone);
  if (!digits.startsWith('55')) {
    return phone.trim() || '—';
  }

  const national = digits.slice(2);
  if (national.length === 11) {
    return `+55 (${national.slice(0, 2)}) ${national.slice(2, 7)}-${national.slice(7)}`;
  }

  if (national.length === 10) {
    return `+55 (${national.slice(0, 2)}) ${national.slice(2, 6)}-${national.slice(6)}`;
  }

  return `+${digits}`;
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
