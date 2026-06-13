import type { ListFilterValues } from '@client-manager/shared';

/** Billing cycle key aligned with dashboard billing snapshot (YYYY-MM). */
export function currentBillingCycleKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export const dashboardCustomerListFilters = {
  active: { status: 'active' } satisfies ListFilterValues,
  expiringSoon: { expiringWithinDays: '7' } satisfies ListFilterValues,
  expired: { expiredOnly: 'true' } satisfies ListFilterValues,
  upcomingExpirations: {
    upcomingOnly: 'true',
    sortBy: 'expiresAt_asc_name',
  } satisfies ListFilterValues,
} as const;

export const dashboardInvoiceListFilters = {
  open: { status: 'open' } satisfies ListFilterValues,
  overdue: { status: 'overdue' } satisfies ListFilterValues,
  canceled: { status: 'canceled' } satisfies ListFilterValues,
  currentCycle: { billingCycleKey: currentBillingCycleKey() } satisfies ListFilterValues,
} as const;

export const dashboardPaymentListFilters = {
  currentMonth: { billingCycleKey: currentBillingCycleKey() } satisfies ListFilterValues,
} as const;

export const dashboardActivationListFilters = {
  pending: { status: 'pending' } satisfies ListFilterValues,
} as const;
