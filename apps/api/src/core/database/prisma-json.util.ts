import type { Prisma } from '@prisma/client';

/**
 * Casts a JSON-serializable value to Prisma's JSON column input type.
 *
 * Shared package types such as {@code Record<string, unknown>} or
 * {@code Record<string, string[] | ...>} are not assignable to
 * {@link Prisma.InputJsonValue} in strict CI builds — always use this helper
 * at Prisma Json field boundaries.
 *
 * @author João Paulo da Silva
 * @since 4.9.0
 * @creationDate 14/06/2026
 */
export function toPrismaInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
