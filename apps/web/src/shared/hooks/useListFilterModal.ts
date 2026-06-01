import { useState } from 'react';
import type { ListFilterValues } from '@client-manager/shared';

export function useListFilterModal(
  filters: ListFilterValues,
  setFilters: (values: ListFilterValues) => void,
  clearFilters: () => void,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<ListFilterValues>({});

  const open = () => {
    setDraft(filters);
    setIsOpen(true);
  };

  const apply = () => {
    setFilters(draft);
    setIsOpen(false);
  };

  const clear = () => {
    setDraft({});
    clearFilters();
    setIsOpen(false);
  };

  return {
    isOpen,
    setIsOpen,
    draft,
    setDraft,
    open,
    apply,
    clear,
  };
}
