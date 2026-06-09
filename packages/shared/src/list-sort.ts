export type ListSortOption = { value: string; label: string };

export const CUSTOMER_SORT_VALUES = ['expiresAt_asc_name', 'name_asc', 'createdAt_desc'] as const;
export type CustomerSortValue = (typeof CUSTOMER_SORT_VALUES)[number];
export const CUSTOMER_DEFAULT_SORT: CustomerSortValue = 'expiresAt_asc_name';

export const CUSTOMER_SORT_OPTIONS: ListSortOption[] = [
  { value: 'expiresAt_asc_name', label: 'Vencimento (mais próximo), depois nome' },
  { value: 'name_asc', label: 'Nome (A–Z)' },
  { value: 'createdAt_desc', label: 'Mais recentes' },
];

export const PLAN_SORT_VALUES = ['createdAt_desc', 'name_asc', 'price_asc', 'price_desc'] as const;
export type PlanSortValue = (typeof PLAN_SORT_VALUES)[number];
export const PLAN_DEFAULT_SORT: PlanSortValue = 'createdAt_desc';

export const PLAN_SORT_OPTIONS: ListSortOption[] = [
  { value: 'createdAt_desc', label: 'Mais recentes' },
  { value: 'name_asc', label: 'Nome (A–Z)' },
  { value: 'price_asc', label: 'Preço (menor primeiro)' },
  { value: 'price_desc', label: 'Preço (maior primeiro)' },
];

export const SERVER_SORT_VALUES = ['createdAt_desc', 'name_asc'] as const;
export type ServerSortValue = (typeof SERVER_SORT_VALUES)[number];
export const SERVER_DEFAULT_SORT: ServerSortValue = 'createdAt_desc';

export const SERVER_SORT_OPTIONS: ListSortOption[] = [
  { value: 'createdAt_desc', label: 'Mais recentes' },
  { value: 'name_asc', label: 'Nome (A–Z)' },
];

export function isCustomerSortValue(value: string): value is CustomerSortValue {
  return (CUSTOMER_SORT_VALUES as readonly string[]).includes(value);
}

export function isPlanSortValue(value: string): value is PlanSortValue {
  return (PLAN_SORT_VALUES as readonly string[]).includes(value);
}

export function isServerSortValue(value: string): value is ServerSortValue {
  return (SERVER_SORT_VALUES as readonly string[]).includes(value);
}
