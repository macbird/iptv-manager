import {
  CUSTOMER_DEFAULT_SORT,
  CUSTOMER_SORT_VALUES,
  PLAN_DEFAULT_SORT,
  PLAN_SORT_VALUES,
  SERVER_DEFAULT_SORT,
  SERVER_SORT_VALUES,
} from '@client-manager/shared';

function pickSortKey(value: string | undefined, allowed: readonly string[], fallback: string): string {
  const trimmed = value?.trim();
  if (trimmed && allowed.includes(trimmed)) {
    return trimmed;
  }
  return fallback;
}

/**
 * Resolves Prisma orderBy clauses for customer listings.
 */
export function customerOrderBy(sortBy?: string) {
  const key = pickSortKey(sortBy, CUSTOMER_SORT_VALUES, CUSTOMER_DEFAULT_SORT);
  switch (key) {
    case 'name_asc':
      return [{ name: 'asc' as const }];
    case 'createdAt_desc':
      return [{ createdAt: 'desc' as const }];
    case 'expiresAt_asc_name':
    default:
      return [{ expiresAt: 'asc' as const }, { name: 'asc' as const }];
  }
}

/**
 * Resolves Prisma orderBy clauses for plan listings.
 */
export function planOrderBy(sortBy?: string) {
  const key = pickSortKey(sortBy, PLAN_SORT_VALUES, PLAN_DEFAULT_SORT);
  switch (key) {
    case 'name_asc':
      return [{ name: 'asc' as const }];
    case 'price_asc':
      return [{ price: 'asc' as const }];
    case 'price_desc':
      return [{ price: 'desc' as const }];
    case 'createdAt_desc':
    default:
      return [{ createdAt: 'desc' as const }];
  }
}

/**
 * Resolves Prisma orderBy clauses for server listings.
 */
export function serverOrderBy(sortBy?: string) {
  const key = pickSortKey(sortBy, SERVER_SORT_VALUES, SERVER_DEFAULT_SORT);
  switch (key) {
    case 'name_asc':
      return [{ name: 'asc' as const }];
    case 'createdAt_desc':
    default:
      return [{ createdAt: 'desc' as const }];
  }
}
