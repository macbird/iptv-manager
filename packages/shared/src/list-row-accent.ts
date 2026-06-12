import { CustomerStatus } from './enums';
import { ENTITY_INACTIVE_STATUS } from './entity-lifecycle';
import { isPastCalendarDate } from './date-calendar';
/** Left-border accent for paginated list rows/cards. */
export type ListRowAccent = 'none' | 'muted' | 'danger' | 'warning' | 'caution';

const SERVER_STATUS_ACCENT: Record<string, ListRowAccent> = {
  inactive: 'muted',
  maintenance: 'warning',
  full: 'caution',
  active: 'none',
};

export function resolveEntityLifecycleAccent(status: string): ListRowAccent {
  if (status === ENTITY_INACTIVE_STATUS || status === CustomerStatus.BLOCKED) {
    return 'muted';
  }
  return 'none';
}

export function resolveCustomerListRowAccent(params: {
  status: string;
  expiresAt?: string | null;
}): ListRowAccent {
  const lifecycle = resolveEntityLifecycleAccent(params.status);
  if (lifecycle !== 'none') return lifecycle;
  if (isPastCalendarDate(params.expiresAt)) return 'danger';
  return 'none';
}

export function resolveInvoiceListRowAccent(params: {
  status: string;
  dueDate: string | Date;
}): ListRowAccent {
  if (params.status === 'canceled') return 'muted';
  if (params.status === 'paid') return 'none';
  if (params.status === 'overdue' || isPastCalendarDate(params.dueDate)) return 'danger';
  return 'none';
}

export function resolveAccountListRowAccent(params: {
  status: string;
  nextDueDate?: string | null;
}): ListRowAccent {
  if (params.status === ENTITY_INACTIVE_STATUS) return 'muted';
  if (isPastCalendarDate(params.nextDueDate)) return 'danger';
  return 'none';
}

export function resolveServerListRowAccent(status: string): ListRowAccent {
  return SERVER_STATUS_ACCENT[status] ?? 'none';
}
