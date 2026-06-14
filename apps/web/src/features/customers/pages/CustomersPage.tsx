import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../api/customers.api';
import { plansApi } from '../../plans/api/plans.api';
import { Edit2 } from 'lucide-react';
import { Modal } from '../../../shared/ui/modals/Modal';
import { EntityLifecycleActions } from '../../../shared/ui/buttons/EntityLifecycleActions';
import { showToast } from '../../../shared/utils/toast';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { CustomerListAvatar } from '../components/CustomerListAvatar';
import { ResponsiveDataGrid } from '../../../shared/ui/layout/ResponsiveDataGrid';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { PageHeaderActions } from '../../../shared/ui/layout/PageHeaderActions';
import { ListPagination } from '../../../shared/ui/lists/ListPagination';
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList';
import { useListFilterModal } from '../../../shared/hooks/useListFilterModal';
import { useEntityFormModal, useOpenFormFromRouteState } from '../../../shared/hooks/useEntityFormModal';
import { useListFiltersFromRouteState } from '../../../shared/hooks/useListFiltersFromRouteState';
import { ListFiltersModal } from '../../../shared/ui/lists/ListFiltersModal';
import { ListEntityStatusBadge } from '../../../shared/ui/lists/ListEntityStatusBadge';
import {
  CUSTOMER_FILTER_FIELDS,
  withPlanOptions,
} from '../../../shared/ui/lists/list-filter-fields';
import {
  getApiErrorMessage,
  getCustomerListStatusBadgeClass,
  getCustomerListStatusLabel,
  isCustomerExpiryOverdue,
  resolveCustomerListRowAccent,
  type CustomerListItem,
} from '@client-manager/shared';

export const CustomersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [lifecycleTarget, setLifecycleTarget] = useState<{
    id: string;
    name: string;
    action: 'deactivate' | 'activate';
  } | null>(null);
  const formModal = useEntityFormModal();

  const {
    items,
    total,
    totalPages,
    page,
    pageSize,
    filter,
    setFilter,
    filters,
    setFilters,
    clearFilters,
    activeFilterCount,
    goToPreviousPage,
    goToNextPage,
    isLoading,
  } = usePaginatedList<CustomerListItem>({
    queryKey: ['customers'],
    queryFn: customersApi.list,
  });

  useListFiltersFromRouteState(setFilters);
  useOpenFormFromRouteState(formModal);

  const filterModal = useListFilterModal(filters, setFilters, clearFilters);

  const { data: plansForFilter } = useQuery({
    queryKey: ['plans-for-filter'],
    queryFn: () => plansApi.list({ page: 1, pageSize: 100, filter: '' }),
  });

  const customerFilterFields = withPlanOptions(
    CUSTOMER_FILTER_FIELDS,
    plansForFilter?.data ?? [],
  );

  const lifecycleMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'deactivate' | 'activate' }) =>
      action === 'deactivate' ? customersApi.deactivate(id) : customersApi.activate(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setLifecycleTarget(null);
      showToast.success(
        variables.action === 'deactivate' ? 'Cliente desativado' : 'Cliente reativado',
      );
    },
    onError: (err: unknown) =>
      showToast.error(getApiErrorMessage(err, 'Não foi possível alterar o status do cliente')),
  });

  const renderCustomerName = (c: CustomerListItem) => (
    <div className="flex min-w-0 items-center gap-2.5">
      <CustomerListAvatar name={c.name} warning={c.configurationWarning} size="sm" />
      <span className="truncate">{c.name}</span>
    </div>
  );

  const columns = [
    { header: 'Nome', accessor: (c: CustomerListItem) => renderCustomerName(c), width: '22%' },
    { header: 'Plano', accessor: (c: CustomerListItem) => c.plan?.name || '-', width: '16%' },
    {
      header: 'Conexões',
      accessor: (c: CustomerListItem) => c.connectionCount,
      width: '10%',
      align: 'center' as const,
    },
    { header: 'Telefone', accessor: (c: CustomerListItem) => c.phone || '-', width: '16%' },
    {
      header: 'Vencimento',
      accessor: (c: CustomerListItem) => (
        <span
          className={
            isCustomerExpiryOverdue(c.expiresAt) ? 'font-semibold text-red-600' : undefined
          }
        >
          {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '-'}
        </span>
      ),
      width: '14%',
    },
    {
      header: 'Ações',
      width: '120px',
      align: 'right' as const,
      accessor: (c: CustomerListItem) => (
        <div className="flex justify-end">
          <button
            onClick={() => formModal.openEdit(c.id)}
            className="text-slate-500 hover:text-form-primary p-2"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <EntityLifecycleActions
            status={c.status}
            isPending={lifecycleMutation.isPending}
            entityLabel="cliente"
            onDeactivate={() =>
              setLifecycleTarget({ id: c.id, name: c.name, action: 'deactivate' })
            }
            onActivate={() =>
              setLifecycleTarget({ id: c.id, name: c.name, action: 'activate' })
            }
          />
        </div>
      ),
    },
  ];

  const renderMobileCard = (c: CustomerListItem) => {
    return (
      <div className="flex items-center justify-between group py-1">
        <div className="flex items-center space-x-3 overflow-hidden flex-1">
          <CustomerListAvatar name={c.name} warning={c.configurationWarning} />
          <div className="overflow-hidden">
            <div className="mb-0.5 truncate text-sm font-bold leading-tight text-slate-900">
              {c.name}
            </div>
            <div className="flex flex-col">
              <div className="text-[10px] text-slate-400 truncate leading-none mb-1">
                {c.phone || 'Sem telefone'}
              </div>
              <div className="text-[9px] font-medium text-form-primary/70 uppercase tracking-tighter leading-none">
                {c.connectionCount} conexões
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center shrink-0 gap-2 w-[55%]">
          <div className="flex-1 text-center min-w-0">
            <div className="text-[10px] text-slate-400 truncate">{c.plan?.name || '-'}</div>
            <div
              className={`text-[11px] font-bold truncate ${
                isCustomerExpiryOverdue(c.expiresAt) ? 'text-red-500' : 'text-slate-900'
              }`}
            >
              {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '-'}
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1 min-w-[4.5rem]">
            <ListEntityStatusBadge
              label={getCustomerListStatusLabel(c.status)}
              badgeClassName={getCustomerListStatusBadgeClass(c.status)}
            />
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => formModal.openEdit(c.id)}
                className="p-2 text-slate-400 hover:text-form-primary"
                aria-label="Editar cliente"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <EntityLifecycleActions
                status={c.status}
                isPending={lifecycleMutation.isPending}
                entityLabel="cliente"
                onDeactivate={() =>
                  setLifecycleTarget({ id: c.id, name: c.name, action: 'deactivate' })
                }
                onActivate={() =>
                  setLifecycleTarget({ id: c.id, name: c.name, action: 'activate' })
                }
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageLayout
      title="Clientes"
      noPadding={true}
      actions={
        <PageHeaderActions
          onSearch={setFilter}
          currentFilter={filter}
          onOpenFilters={filterModal.open}
          activeFilterCount={activeFilterCount}
          primaryAction={{
            label: 'Novo',
            onClick: formModal.openCreate,
          }}
        />
      }
      footer={
        <ListPagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPrevious={goToPreviousPage}
          onNext={goToNextPage}
        />
      }
    >
      <ResponsiveDataGrid
        data={items}
        columns={columns}
        renderMobileCard={renderMobileCard}
        mobileHeaderTitles={['Nome', 'Plano', 'Venc']}
        isLoading={isLoading}
        getRowAccent={(c) =>
          resolveCustomerListRowAccent({ status: c.status, expiresAt: c.expiresAt })
        }
      />

      <CustomerFormModal
        isOpen={formModal.isOpen}
        editId={formModal.editId}
        onClose={formModal.close}
      />

      <Modal
        isOpen={!!lifecycleTarget}
        onClose={() => setLifecycleTarget(null)}
        onConfirm={() =>
          lifecycleTarget &&
          lifecycleMutation.mutate({ id: lifecycleTarget.id, action: lifecycleTarget.action })
        }
        confirmTone="primary"
        confirmLabel={lifecycleTarget?.action === 'deactivate' ? 'Desativar' : 'Reativar'}
        title={
          lifecycleTarget?.action === 'deactivate' ? 'Desativar cliente' : 'Reativar cliente'
        }
        description={
          lifecycleTarget?.action === 'deactivate'
            ? `Desativar "${lifecycleTarget?.name}"? Faturas e pagamentos permanecem no histórico. O cliente não aparecerá em novos cadastros.`
            : `Reativar "${lifecycleTarget?.name}"?`
        }
      />

      <ListFiltersModal
        isOpen={filterModal.isOpen}
        onClose={() => filterModal.setIsOpen(false)}
        fields={customerFilterFields}
        draft={filterModal.draft}
        onDraftChange={filterModal.setDraft}
        onApply={filterModal.apply}
        onClear={filterModal.clear}
      />
    </PageLayout>
  );
};
