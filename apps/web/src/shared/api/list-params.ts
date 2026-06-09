import type { PaginatedListParams } from '../../hooks/usePaginatedList';

export function toListQueryParams(params: PaginatedListParams) {
  return {
    page: params.page,
    pageSize: params.pageSize,
    filter: params.filter,
    ...params.filters,
    ...(params.selectableOnly ? { selectableOnly: 'true' } : {}),
    ...(params.payableOnly ? { payableOnly: 'true' } : {}),
    ...(params.sortBy ? { sortBy: params.sortBy } : {}),
  };
}
