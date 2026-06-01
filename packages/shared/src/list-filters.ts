/** Key-value filters sent as query params alongside text search. */
export type ListFilterValues = Record<string, string>;

export function countActiveListFilters(filters: ListFilterValues): number {
  return Object.values(filters).filter((value) => value.trim() !== '').length;
}

export function stripEmptyListFilters(filters: ListFilterValues): ListFilterValues {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value.trim() !== ''),
  );
}
