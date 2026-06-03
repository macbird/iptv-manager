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
import { ENTITY_LIFECYCLE_LABELS, ENTITY_INACTIVE_STATUS } from '@client-manager/shared';
import { showToast } from '../../../shared/utils/toast';

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
    onError: () => showToast.error('Não foi possível alterar o status do plano'),
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
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            p.status === ENTITY_INACTIVE_STATUS
              ? 'bg-slate-100 text-slate-500'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {p.status === ENTITY_INACTIVE_STATUS
            ? ENTITY_LIFECYCLE_LABELS.inactive
            : ENTITY_LIFECYCLE_LABELS.active}
        </span>
      ),
      width: '16%',
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
    <div className="flex items-center justify-between group h-12">
      <div className="flex items-center space-x-3 overflow-hidden flex-1">
        <div className="overflow-hidden">
          <div className="text-sm font-bold text-slate-900 truncate leading-tight">{p.name}</div>
          <div className="text-[10px] text-slate-400 truncate leading-tight">
            {p.maxConnections} conexões
          </div>
        </div>
      </div>

      <div className="flex items-center shrink-0 gap-2">
        <div className="text-sm font-medium text-slate-900">R$ {Number(p.price).toFixed(2)}</div>
        {renderActions(p)}
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
