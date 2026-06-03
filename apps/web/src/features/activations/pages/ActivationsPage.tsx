import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { activationsApi } from '../api/activations.api';
import { ActivationStatusModal } from '../components/ActivationStatusModal';
import { ActivationDetailModal } from '../components/ActivationDetailModal';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { PageHeaderActions } from '../../../shared/ui/layout/PageHeaderActions';
import { ListPagination } from '../../../shared/ui/lists/ListPagination';
import { ResponsiveDataGrid } from '../../../shared/ui/layout/ResponsiveDataGrid';
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList';
import { useListFilterModal } from '../../../shared/hooks/useListFilterModal';
import { ListFiltersModal } from '../../../shared/ui/lists/ListFiltersModal';
import { ACTIVATION_FILTER_FIELDS } from '../../../shared/ui/lists/list-filter-fields';
import {
  CONNECTION_RENEWAL_STATUS_LABELS,
  getConnectionRenewalStatusBadgeClass,
  type ActivationListItem,
  type ActivationStatusInputValue,
} from '@client-manager/shared';
import { showToast } from '../../../shared/utils/toast';
import { formatCents } from '../../../shared/ui/billing/format-billing';

export const ActivationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const defaultFiltersApplied = React.useRef(false);

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
  } = usePaginatedList<ActivationListItem>({
    queryKey: ['activations'],
    queryFn: (params) => activationsApi.list(params),
  });

  React.useEffect(() => {
    if (!defaultFiltersApplied.current) {
      setFilters({ status: 'pending' });
      defaultFiltersApplied.current = true;
    }
  }, [setFilters]);

  const filterModal = useListFilterModal(filters, setFilters, clearFilters);
  const [statusModalOpen, setStatusModalOpen] = React.useState(false);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedActivationId, setSelectedActivationId] = React.useState<string | null>(null);
  const [selectedActivation, setSelectedActivation] = React.useState<ActivationListItem | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['activations'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const completeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => activationsApi.complete(id, notes),
    onSuccess: (data: { newExpiresAt?: string | null; customerExpiresAtUpdated?: boolean }) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDetailModalOpen(false);
      setSelectedActivationId(null);
      if (data.customerExpiresAtUpdated && data.newExpiresAt) {
        showToast.success(
          `Ativação concluída. Vencimento atualizado para ${new Date(data.newExpiresAt).toLocaleDateString('pt-BR')}.`,
        );
      } else {
        showToast.success('Ativação concluída no servidor.');
      }
    },
    onError: () => showToast.error('Erro ao concluir ativação'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: ActivationStatusInputValue; notes?: string }) =>
      activationsApi.updateStatus(id, { status, notes }),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setStatusModalOpen(false);
      setSelectedActivation(null);
      showToast.success('Status atualizado');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      showToast.error(err.response?.data?.message ?? 'Erro ao alterar status');
    },
  });

  const openDetail = (activation: ActivationListItem) => {
    setSelectedActivationId(activation.id);
    setDetailModalOpen(true);
  };

  const openStatusModal = (activation: ActivationListItem, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setSelectedActivation(activation);
    setStatusModalOpen(true);
  };

  const renderActions = (row: ActivationListItem) => (
    <div className="flex justify-end gap-1">
      {row.status !== 'completed' ? (
        <button
          type="button"
          onClick={(e) => openStatusModal(row, e)}
          disabled={statusMutation.isPending}
          className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-50"
          title="Alterar status"
          aria-label="Alterar status"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );

  const connectionCountLabel = (count: number) =>
    count === 1 ? '1 conexão' : `${count} conexões`;

  const columns = [
    { header: 'Cliente', accessor: (row: ActivationListItem) => row.customer.name, width: '24%' },
    {
      header: 'Conexões',
      accessor: (row: ActivationListItem) => (
        <span className="text-sm text-slate-600">{connectionCountLabel(row.connectionCount)}</span>
      ),
      width: '14%',
    },
    {
      header: 'Pago em',
      accessor: (row: ActivationListItem) =>
        new Date(row.payment.paidAt).toLocaleDateString('pt-BR'),
      width: '12%',
    },
    {
      header: 'Valor',
      accessor: (row: ActivationListItem) => formatCents(row.payment.amountCents),
      width: '10%',
    },
    {
      header: 'Vencimento',
      accessor: (row: ActivationListItem) =>
        row.customer.expiresAt
          ? new Date(row.customer.expiresAt).toLocaleDateString('pt-BR')
          : '-',
      width: '12%',
    },
    {
      header: 'Status',
      accessor: (row: ActivationListItem) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getConnectionRenewalStatusBadgeClass(row.status)}`}
        >
          {CONNECTION_RENEWAL_STATUS_LABELS[row.status]}
        </span>
      ),
      width: '12%',
    },
    {
      header: 'Ações',
      width: '72px',
      align: 'right' as const,
      accessor: (row: ActivationListItem) => renderActions(row),
    },
  ];

  const renderMobileCard = (row: ActivationListItem) => {
    const initials = row.customer.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return (
      <div className="flex items-center justify-between group py-1">
        <div className="flex items-center space-x-3 overflow-hidden flex-1">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-500">{initials}</span>
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-slate-900 truncate leading-tight mb-0.5">
              {row.customer.name}
            </div>
            <div className="text-[10px] text-slate-400 truncate leading-none">
              {connectionCountLabel(row.connectionCount)} · {formatCents(row.payment.amountCents)}
            </div>
          </div>
        </div>

        <div className="flex items-center shrink-0 gap-2">
          <div className="text-right">
            <div className="text-[11px] font-bold text-slate-900">
              {row.customer.expiresAt
                ? new Date(row.customer.expiresAt).toLocaleDateString('pt-BR')
                : '-'}
            </div>
            <span
              className={`inline-flex mt-0.5 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${getConnectionRenewalStatusBadgeClass(row.status)}`}
            >
              {CONNECTION_RENEWAL_STATUS_LABELS[row.status]}
            </span>
          </div>
          <div className="flex items-center">{renderActions(row)}</div>
        </div>
      </div>
    );
  };

  return (
    <PageLayout
      title="Ativações pendentes"
      noPadding
      actions={
        <PageHeaderActions
          onSearch={setFilter}
          currentFilter={filter}
          placeholder="Buscar cliente ou telefone..."
          onOpenFilters={filterModal.open}
          activeFilterCount={activeFilterCount}
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
        mobileHeaderTitles={['Cliente', 'Vencimento']}
        isLoading={isLoading}
        onRowClick={openDetail}
      />

      <ListFiltersModal
        isOpen={filterModal.isOpen}
        onClose={() => filterModal.setIsOpen(false)}
        fields={ACTIVATION_FILTER_FIELDS}
        draft={filterModal.draft}
        onDraftChange={filterModal.setDraft}
        onApply={filterModal.apply}
        onClear={filterModal.clear}
      />

      <ActivationDetailModal
        activationId={selectedActivationId}
        isOpen={detailModalOpen}
        isCompleting={completeMutation.isPending}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedActivationId(null);
        }}
        onComplete={(notes) => {
          if (!selectedActivationId) return;
          completeMutation.mutate({ id: selectedActivationId, notes });
        }}
      />

      <ActivationStatusModal
        activation={selectedActivation}
        isOpen={statusModalOpen}
        isPending={statusMutation.isPending}
        onClose={() => {
          setStatusModalOpen(false);
          setSelectedActivation(null);
        }}
        onSubmit={(status, notes) => {
          if (!selectedActivation) return;
          statusMutation.mutate({ id: selectedActivation.id, status, notes });
        }}
      />
    </PageLayout>
  );
};
