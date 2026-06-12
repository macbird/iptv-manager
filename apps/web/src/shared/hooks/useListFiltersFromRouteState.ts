import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { stripEmptyListFilters, type ListFilterValues } from '@client-manager/shared';

export type AppRouteState = {
  form?: 'create' | 'edit';
  id?: string;
  listFilters?: ListFilterValues;
};

interface UseListFiltersFromRouteStateOptions {
  /** Applied once when the page opens without route filters (e.g. activations default). */
  defaultFilters?: ListFilterValues;
}

function routeStateSignature(state: AppRouteState | null | undefined): string {
  if (!state) return '';
  return JSON.stringify({
    listFilters: state.listFilters ?? null,
    form: state.form ?? null,
    id: state.id ?? null,
  });
}

/**
 * Reads `listFilters` from react-router location state, applies them to the list,
 * then clears them from history while preserving form modal state when present.
 */
export function useListFiltersFromRouteState(
  setFilters: (values: ListFilterValues) => void,
  options?: UseListFiltersFromRouteStateOptions,
) {
  const location = useLocation();
  const navigate = useNavigate();
  const setFiltersRef = React.useRef(setFilters);
  const defaultsAppliedRef = React.useRef(false);
  const handledRouteSignatureRef = React.useRef<string | null>(null);

  setFiltersRef.current = setFilters;

  const defaultFilters = options?.defaultFilters;
  const defaultFiltersSignature = defaultFilters
    ? JSON.stringify(stripEmptyListFilters(defaultFilters))
    : '';

  React.useEffect(() => {
    const state = location.state as AppRouteState | null;
    const routeSignature = `${location.key}:${routeStateSignature(state)}`;

    if (handledRouteSignatureRef.current === routeSignature) {
      return;
    }

    const routeFilters = state?.listFilters
      ? stripEmptyListFilters(state.listFilters)
      : {};

    if (Object.keys(routeFilters).length > 0) {
      setFiltersRef.current(routeFilters);
      defaultsAppliedRef.current = true;
      handledRouteSignatureRef.current = routeSignature;

      const remainingState: AppRouteState | null =
        state?.form || state?.id ? { form: state.form, id: state.id } : null;

      navigate(location.pathname, { replace: true, state: remainingState });
      return;
    }

    handledRouteSignatureRef.current = routeSignature;

    if (defaultFilters && !defaultsAppliedRef.current) {
      setFiltersRef.current(stripEmptyListFilters(defaultFilters));
      defaultsAppliedRef.current = true;
    }
  }, [defaultFilters, defaultFiltersSignature, location.key, location.pathname, location.state, navigate]);
}
