import { CustomerStatus } from './enums';
import { ENTITY_LIFECYCLE_LABELS } from './entity-lifecycle';
import { isPastCalendarDate } from './date-calendar';

/** Values accepted by API and persistence (matches Prisma CustomerStatus). */
export const CUSTOMER_STATUS_VALUES = [
  CustomerStatus.ACTIVE,
  CustomerStatus.TRIAL,
  CustomerStatus.OVERDUE,
  CustomerStatus.BLOCKED,
  CustomerStatus.INACTIVE,
] as const;

export type CustomerStatusValue = (typeof CUSTOMER_STATUS_VALUES)[number];

/** Status options exposed in customer forms and list filters. */
export const CUSTOMER_UI_STATUS_VALUES = [
  CustomerStatus.ACTIVE,
  CustomerStatus.BLOCKED,
  CustomerStatus.INACTIVE,
] as const;

export type CustomerUiStatusValue = (typeof CUSTOMER_UI_STATUS_VALUES)[number];

const LEGACY_CUSTOMER_STATUSES = new Set<string>([
  CustomerStatus.TRIAL,
  CustomerStatus.OVERDUE,
]);

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatusValue, string> = {
  [CustomerStatus.ACTIVE]: 'Ativo',
  [CustomerStatus.TRIAL]: 'Teste',
  [CustomerStatus.OVERDUE]: 'Vencido',
  [CustomerStatus.BLOCKED]: 'Bloqueado',
  [CustomerStatus.INACTIVE]: ENTITY_LIFECYCLE_LABELS.inactive,
};

export const CUSTOMER_STATUS_BADGE_CLASSES: Record<CustomerStatusValue, string> = {
  [CustomerStatus.ACTIVE]: 'bg-green-100 text-green-700',
  [CustomerStatus.TRIAL]: 'bg-amber-100 text-amber-700',
  [CustomerStatus.OVERDUE]: 'bg-red-100 text-red-700',
  [CustomerStatus.BLOCKED]: 'bg-slate-100 text-slate-700',
  [CustomerStatus.INACTIVE]: 'bg-slate-100 text-slate-500',
};

export function getCustomerStatusLabel(status: string): string {
  return CUSTOMER_STATUS_LABELS[status as CustomerStatusValue] ?? status;
}

export function getCustomerStatusBadgeClass(status: string): string {
  return CUSTOMER_STATUS_BADGE_CLASSES[status as CustomerStatusValue] ?? 'bg-slate-100 text-slate-700';
}

/**
 * List label — trial/overdue legacy values are shown as Ativo; expiry uses {@link expiresAt}.
 */
export function getCustomerListStatusLabel(status: string): string {
  if (status === CustomerStatus.INACTIVE) {
    return ENTITY_LIFECYCLE_LABELS.inactive;
  }
  if (status === CustomerStatus.BLOCKED) {
    return CUSTOMER_STATUS_LABELS[CustomerStatus.BLOCKED];
  }
  if (LEGACY_CUSTOMER_STATUSES.has(status)) {
    return CUSTOMER_STATUS_LABELS[CustomerStatus.ACTIVE];
  }
  return CUSTOMER_STATUS_LABELS[CustomerStatus.ACTIVE];
}

export function getCustomerListStatusBadgeClass(status: string): string {
  if (status === CustomerStatus.INACTIVE || status === CustomerStatus.BLOCKED) {
    return CUSTOMER_STATUS_BADGE_CLASSES[status as CustomerStatusValue];
  }
  return CUSTOMER_STATUS_BADGE_CLASSES[CustomerStatus.ACTIVE];
}

export function isCustomerExpiryOverdue(expiresAt?: string | null): boolean {
  return isPastCalendarDate(expiresAt);
}
