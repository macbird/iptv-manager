import { z } from 'zod';

/** Lowercase alphanumeric segments separated by single hyphens (no spaces). */
export const ACCOUNT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ACCOUNT_SLUG_MIN_LENGTH = 3;
export const ACCOUNT_SLUG_MAX_LENGTH = 48;

/** UI label for the account identifier field (replaces generic "slug"). */
export const ACCOUNT_SLUG_FIELD_LABEL = 'Identificador da conta';

/** Helper text explaining uniqueness and technical usage. */
export const ACCOUNT_SLUG_FIELD_HINT =
  'Código único, sem espaços. Ex.: torotv — usado na instância WhatsApp (Evolution) e nas URLs de webhook de pagamento.';

/**
 * Normalizes user input before validation (trim + lowercase).
 */
export function normalizeAccountSlug(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Validates tenant account identifier: required, unique in DB, URL-safe, no spaces.
 */
export const accountSlugSchema = z
  .string({ required_error: 'Identificador da conta é obrigatório' })
  .min(1, 'Identificador da conta é obrigatório')
  .transform(normalizeAccountSlug)
  .pipe(
    z
      .string()
      .min(
        ACCOUNT_SLUG_MIN_LENGTH,
        `Identificador deve ter pelo menos ${ACCOUNT_SLUG_MIN_LENGTH} caracteres`,
      )
      .max(
        ACCOUNT_SLUG_MAX_LENGTH,
        `Identificador deve ter no máximo ${ACCOUNT_SLUG_MAX_LENGTH} caracteres`,
      )
      .regex(
        ACCOUNT_SLUG_PATTERN,
        'Use apenas letras minúsculas, números e hífens (sem espaços ou caracteres especiais)',
      ),
  );

export type AccountSlug = z.infer<typeof accountSlugSchema>;
