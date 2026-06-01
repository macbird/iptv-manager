import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  countActiveListFilters,
  stripEmptyListFilters,
  type ListFilterValues,
  type PaginatedResponse,
} from '@client-manager/shared';

export interface PaginatedListParams {
  page: number;
  pageSize: number;
  filter: string;
  filters?: ListFilterValues;
}

interface UsePaginatedListOptions<T> {
  queryKey: string[];
  queryFn: (params: PaginatedListParams) => Promise<PaginatedResponse<T>>;
  pageSize?: number;
}

export function usePaginatedList<T>({
  queryKey,
  queryFn,
  pageSize = 10,
}: UsePaginatedListOptions<T>) {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [filters, setFilters] = useState<ListFilterValues>({});

  const activeFilters = stripEmptyListFilters(filters);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...queryKey, page, filter, activeFilters],
    queryFn: () =>
      queryFn({
        page,
        pageSize,
        filter,
        filters: activeFilters,
      }),
    placeholderData: keepPreviousData,
  });

  const total = data?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;

  const setFilterAndResetPage = (value: string) => {
    setFilter(value);
    setPage(1);
  };

  const setFiltersAndResetPage = (values: ListFilterValues) => {
    setFilters(stripEmptyListFilters(values));
    setPage(1);
  };

  const goToPreviousPage = () => setPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setPage((p) => (totalPages > 0 ? Math.min(totalPages, p + 1) : p + 1));

  return {
    items: data?.data ?? [],
    total,
    totalPages,
    page,
    pageSize,
    filter,
    filters,
    activeFilterCount: countActiveListFilters(filters),
    setFilter: setFilterAndResetPage,
    setFilters: setFiltersAndResetPage,
    clearFilters: () => setFiltersAndResetPage({}),
    setPage,
    goToPreviousPage,
    goToNextPage,
    isLoading,
    isFetching,
  };
}
