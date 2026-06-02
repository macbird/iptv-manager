import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type EntityFormMode =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; id: string };

export function useEntityFormModal() {
  const [mode, setMode] = React.useState<EntityFormMode>({ type: 'closed' });

  const openCreate = React.useCallback(() => setMode({ type: 'create' }), []);
  const openEdit = React.useCallback((id: string) => setMode({ type: 'edit', id }), []);
  const close = React.useCallback(() => setMode({ type: 'closed' }), []);

  return {
    isOpen: mode.type !== 'closed',
    isCreate: mode.type === 'create',
    editId: mode.type === 'edit' ? mode.id : null,
    openCreate,
    openEdit,
    close,
  };
}

export function useOpenFormFromRouteState(formModal: ReturnType<typeof useEntityFormModal>) {
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const state = location.state as { form?: 'create' | 'edit'; id?: string } | null;
    if (!state?.form) return;

    if (state.form === 'create') {
      formModal.openCreate();
    } else if (state.form === 'edit' && state.id) {
      formModal.openEdit(state.id);
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, formModal.openCreate, formModal.openEdit]);
}

export function useOpenCreateModalFromRoute(setOpen: (open: boolean) => void) {
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const state = location.state as { form?: 'create' } | null;
    if (state?.form !== 'create') return;

    setOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, setOpen]);
}
