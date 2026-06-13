import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Star, Trash2 } from 'lucide-react';
import type { PlatformPlanListItem } from '@client-manager/shared';
import { getApiErrorMessage } from '@client-manager/shared';
import { platformPlansApi } from '../api/platform-plans.api';
import { PlatformPlanFormModal } from '../components/PlatformPlanFormModal';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { ResponsiveDataGrid } from '../../../shared/ui/layout/ResponsiveDataGrid';
import { PageHeaderActions } from '../../../shared/ui/layout/PageHeaderActions';
import { ListPagination } from '../../../shared/ui/lists/ListPagination';
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList';
import { useEntityFormModal } from '../../../shared/hooks/useEntityFormModal';
import { Modal } from '../../../shared/ui/modals/Modal';
import { showToast } from '../../../shared/utils/toast';

const BILLING_CYCLE_LABEL = 'Mensal';

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    cents / 100,
  );
}

export const PlatformPlansPage: React.FC = () => {
  const queryClient = useQueryClient();
  const formModal = useEntityFormModal();
  const [deleteTarget, setDeleteTarget] = useState<PlatformPlanListItem | null>(null);

  const {
    items,
    total,
    totalPages,
    page,
    pageSize,
    filter,
    setFilter,
    goToPreviousPage,
    goToNextPage,
    isLoading,
  } = usePaginatedList<PlatformPlanListItem>({
    queryKey: ['platform-plans'],
    queryFn: platformPlansApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => platformPlansApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-plans'] });
      setDeleteTarget(null);
      showToast.success('Plano removido ou desativado');
    },
    onError: (err: unknown) => {
      showToast.error(getApiErrorMessage(err, 'Não foi possível remover o plano'));
    },
  });

  const renderActions = (row: PlatformPlanListItem) => (
    <div className="flex justify-end gap-1">
      <button
        type="button"
        onClick={() => formModal.openEdit(row.id)}
        className="p-2 text-slate-500 hover:text-indigo-600"
        aria-label={`Editar ${row.name}`}
      >
        <Edit2 className="h-4 w-4" />
      </button>
      {!row.isDefault ? (
        <button
          type="button"
          onClick={() => setDeleteTarget(row)}
          className="p-2 text-slate-500 hover:text-red-600"
          aria-label={`Remover ${row.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );

  const columns = [
    {
      header: 'Nome',
      accessor: (plan: PlatformPlanListItem) => (
        <div className="flex items-center gap-2">
          <span>{plan.name}</span>
          {plan.isDefault ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
              <Star className="h-3 w-3" />
              Padrão
            </span>
          ) : null}
        </div>
      ),
      width: '34%',
    },
    {
      header: 'Status',
      accessor: (plan: PlatformPlanListItem) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            plan.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {plan.active ? 'Ativo' : 'Desativado'}
        </span>
      ),
      width: '14%',
      align: 'center' as const,
    },
    {
      header: 'Ciclo',
      accessor: (plan: PlatformPlanListItem) => BILLING_CYCLE_LABEL,
      width: '14%',
      align: 'center' as const,
    },
    {
      header: 'Valor',
      accessor: (plan: PlatformPlanListItem) => formatMoney(plan.priceCents),
      width: '16%',
    },
    {
      header: 'Contas',
      accessor: (plan: PlatformPlanListItem) => plan.subscriptionCount,
      width: '12%',
      align: 'center' as const,
    },
    {
      header: 'Ações',
      width: '120px',
      align: 'right' as const,
      accessor: (plan: PlatformPlanListItem) => renderActions(plan),
    },
  ];

  const renderMobileCard = (plan: PlatformPlanListItem) => (
    <div className="flex items-center justify-between py-1">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-slate-900">{plan.name}</div>
        <div className="mt-1 text-xs text-slate-500">
          {formatMoney(plan.priceCents)} · {BILLING_CYCLE_LABEL}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            plan.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {plan.active ? 'Ativo' : 'Desativado'}
        </span>
        {renderActions(plan)}
      </div>
    </div>
  );

  return (
    <PageLayout
      title="Planos"
      noPadding
      actions={
        <PageHeaderActions
          onSearch={setFilter}
          currentFilter={filter}
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
        mobileHeaderTitles={['Plano', 'Valor']}
        isLoading={isLoading}
      />

      <PlatformPlanFormModal
        isOpen={formModal.isOpen}
        editId={formModal.editId}
        onClose={formModal.close}
      />

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        confirmTone="danger"
        confirmLabel="Remover"
        title="Remover plano"
        description={
          deleteTarget?.subscriptionCount
            ? `O plano "${deleteTarget.name}" possui ${deleteTarget.subscriptionCount} conta(s) vinculada(s) e será desativado (soft-delete).`
            : `Remover permanentemente o plano "${deleteTarget?.name}"?`
        }
      />
    </PageLayout>
  );
};
