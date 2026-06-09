import type { CustomerListItem } from '@client-manager/shared';
import type { AsyncSearchSelectOption } from '../../../shared/ui/forms/AsyncSearchSelect';

function formatCustomerSearchHint(customer: CustomerListItem): string | undefined {
  const parts: string[] = [];
  if (customer.expiresAt) {
    parts.push(`Vence ${new Date(customer.expiresAt).toLocaleDateString('pt-BR')}`);
  }
  if (customer.phone) {
    parts.push(customer.phone);
  } else if (customer.email) {
    parts.push(customer.email);
  }
  if (customer.plan?.name) {
    parts.push(customer.plan.name);
  }
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

export function mapCustomersToSearchOptions(customers: CustomerListItem[]): AsyncSearchSelectOption[] {
  return customers.map((customer) => ({
    value: customer.id,
    label: customer.name,
    hint: formatCustomerSearchHint(customer),
    meta: {
      planPrice: customer.plan?.price ?? null,
      expiresAt: customer.expiresAt,
    },
  }));
}

export function formatPlanPriceSuggestion(planPrice: unknown): number | null {
  if (typeof planPrice !== 'number' || !Number.isFinite(planPrice) || planPrice <= 0) {
    return null;
  }
  return planPrice;
}
