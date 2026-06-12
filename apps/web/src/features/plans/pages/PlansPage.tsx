import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '../api/plans.api';
import { Edit2 } from 'lucide-react';
import { Modal } from '../../../shared/ui/modals/Modal';
import { PlanFormModal } from '../components/PlanFormModal';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { ResponsiveDataGrid } from '../../../shared/ui/layout/ResponsiveDataGrid';
import { PageHeaderActions } from '../../../shared/ui/layout/PageHeaderActions';
import { ListPagination } from '../../../shared/ui/lists/ListPagination';
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList';
import { useListFilterModal } from '../../../shared/hooks/useListFilterModal';
import { useEntityFormModal, useOpenFormFromRouteState } from '../../../shared/hooks/useEntityFormModal';
import { ListFiltersModal } from '../../../shared/ui/lists/ListFiltersModal';
import { PLAN_FILTER_FIELDS } from '../../../shared/ui/lists/list-filter-fields';
import { EntityLifecycleActions } from '../../../shared/ui/buttons/EntityLifecycleActions';
import {
  getApiErrorMessage,
  getPlanListStatusBadgeClass,
  getPlanListStatusLabel,
  resolveEntityLifecycleAccent,
} from '@client-manager/shared';
import { ListEntityStatusBadge } from '../../../shared/ui/lists/ListEntityStatusBadge';
import { showToast } from '../../../shared/utils/toast';

function planInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

type PlanRow = {
  id: string;
  name: string;
  maxConnections: number;
  price: string | number;
  status: string;
};

export const PlansPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [lifecycleTarget, setLifecycleTarget] = useState<{
    id: string;
    name: string;
    action: 'deactivate' | 'activate';
  } | null>(null);
  const formModal = useEntityFormModal();
  useOpenFormFromRouteState(formModal);

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
  } = usePaginatedList<PlanRow>({
    queryKey: ['plans'],
    queryFn: plansApi.list,
  });

  const filterModal = useListFilterModal(filters, setFilters, clearFilters);

  const lifecycleMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'deactivate' | 'activate' }) =>
      action === 'deactivate' ? plansApi.deactivate(id) : plansApi.activate(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setLifecycleTarget(null);
      showToast.success(
        variables.action === 'deactivate' ? 'Plano desativado' : 'Plano reativado',
      );
    },
    onError: (err: unknown) =>
      showToast.error(getApiErrorMessage(err, 'Não foi possível alterar o status do plano')),
  });

  const renderActions = (row: PlanRow) => (
    <div className="flex justify-end">
      <button
        onClick={() => formModal.openEdit(row.id)}
        className="text-slate-500 hover:text-indigo-600 p-2"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <EntityLifecycleActions
        status={row.status}
        isPending={lifecycleMutation.isPending}
        entityLabel="plano"
        onDeactivate={() =>
          setLifecycleTarget({ id: row.id, name: row.name, action: 'deactivate' })
        }
        onActivate={() =>
          setLifecycleTarget({ id: row.id, name: row.name, action: 'activate' })
        }
      />
    </div>
  );

  const columns = [
    { header: 'Nome', accessor: (p: PlanRow) => p.name, width: '34%' },
    {
      header: 'Status',
      accessor: (p: PlanRow) => (
        <ListEntityStatusBadge
          label={getPlanListStatusLabel(p.status)}
          badgeClassName={getPlanListStatusBadgeClass(p.status)}
        />
      ),
      width: '16%',
      align: 'center' as const,
    },
    {
      header: 'Conexões',
      accessor: (p: PlanRow) => p.maxConnections,
      width: '15%',
      align: 'center' as const,
    },
    {
      header: 'Preço',
      accessor: (p: PlanRow) => `R$ ${Number(p.price).toFixed(2)}`,
      width: '20%',
    },
    {
      header: 'Ações',
      width: '120px',
      align: 'right' as const,
      accessor: (p: PlanRow) => renderActions(p),
    },
  ];

  const renderMobileCard = (p: PlanRow) => (
    <div className="flex items-center justify-between group py-1">
      <div className="flex items-center space-x-3 overflow-hidden flex-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50">
          <span className="text-[11px] font-bold text-slate-500">{planInitials(p.name)}</span>
        </div>
        <div className="overflow-hidden">
          <div className="mb-0.5 truncate text-sm font-bold leading-tight text-slate-900">
            {p.name}
          </div>
          <div className="text-[9px] font-medium uppercase leading-none tracking-tighter text-indigo-500/70">
            {p.maxConnections} conexões
          </div>
        </div>
      </div>

      <div className="flex w-[55%] shrink-0 items-center gap-2">
        <div className="min-w-0 flex-1 text-center">
          <div className="truncate text-[10px] text-slate-400">Preço</div>
          <div className="truncate text-[11px] font-bold text-slate-900">
            R$ {Number(p.price).toFixed(2)}
          </div>
        </div>
        <div className="flex min-w-[4.5rem] shrink-0 flex-col items-end gap-1">
          <ListEntityStatusBadge
            label={getPlanListStatusLabel(p.status)}
            badgeClassName={getPlanListStatusBadgeClass(p.status)}
          />
          <div className="flex items-center justify-end">{renderActions(p)}</div>
        </div>
      </div>
    </div>
  );

  return (
    <PageLayout
      title="Planos"
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
        mobileHeaderTitles={['Nome', 'Preço']}
        isLoading={isLoading}
        getRowAccent={(p) => resolveEntityLifecycleAccent(p.status)}
      />

      <PlanFormModal isOpen={formModal.isOpen} editId={formModal.editId} onClose={formModal.close} />

      <Modal
        isOpen={!!lifecycleTarget}
        onClose={() => setLifecycleTarget(null)}
        onConfirm={() =>
          lifecycleTarget &&
          lifecycleMutation.mutate({ id: lifecycleTarget.id, action: lifecycleTarget.action })
        }
        confirmTone="primary"
        confirmLabel={lifecycleTarget?.action === 'deactivate' ? 'Desativar' : 'Reativar'}
        title={lifecycleTarget?.action === 'deactivate' ? 'Desativar plano' : 'Reativar plano'}
        description={
          lifecycleTarget?.action === 'deactivate'
            ? `Desativar "${lifecycleTarget?.name}"? O plano não aparecerá em novos cadastros de clientes.`
            : `Reativar "${lifecycleTarget?.name}"?`
        }
      />

      <ListFiltersModal
        isOpen={filterModal.isOpen}
        onClose={() => filterModal.setIsOpen(false)}
        fields={PLAN_FILTER_FIELDS}
        draft={filterModal.draft}
        onDraftChange={filterModal.setDraft}
        onApply={filterModal.apply}
        onClear={filterModal.clear}
      />
    </PageLayout>
  );
};
