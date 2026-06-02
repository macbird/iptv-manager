import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { activationsApi } from '../api/activations.api';
import { ActivationStatusModal } from '../components/ActivationStatusModal';
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
  const [selectedActivation, setSelectedActivation] = React.useState<ActivationListItem | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['activations'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const completeMutation = useMutation({
    mutationFn: (id: string) => activationsApi.complete(id),
    onSuccess: (data: { newExpiresAt?: string | null; customerExpiresAtUpdated?: boolean }) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['customers'] });
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

  const handleComplete = (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    completeMutation.mutate(id);
  };

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
      {row.status === 'pending' ? (
        <button
          type="button"
          onClick={(e) => handleComplete(row.id, e)}
          disabled={completeMutation.isPending}
          className="p-2 text-slate-400 hover:text-green-600 disabled:opacity-50"
          title="Concluir ativação no servidor"
          aria-label="Concluir ativação no servidor"
        >
          <CheckCircle2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );

  const columns = [
    { header: 'Cliente', accessor: (row: ActivationListItem) => row.customer.name, width: '20%' },
    {
      header: 'Servidor',
      accessor: (row: ActivationListItem) => row.connection.server.name,
      width: '16%',
    },
    {
      header: 'MAC',
      accessor: (row: ActivationListItem) => (
        <span className="font-mono text-xs text-slate-600">{row.connection.macAddress}</span>
      ),
      width: '16%',
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
      width: '10%',
    },
    {
      header: 'Ações',
      width: '100px',
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
            <div className="flex flex-col">
              <div className="text-[10px] text-slate-400 truncate leading-none mb-1">
                {row.connection.server.name}
              </div>
              <div className="text-[9px] font-mono text-slate-500 truncate leading-none">
                {row.connection.macAddress}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center shrink-0 gap-2 w-[55%]">
          <div className="flex-1 text-center min-w-0">
            <div className="text-[10px] text-slate-400 truncate">
              {formatCents(row.payment.amountCents)}
            </div>
            <div className="text-[11px] font-bold text-slate-900 truncate">
              {row.customer.expiresAt
                ? new Date(row.customer.expiresAt).toLocaleDateString('pt-BR')
                : '-'}
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1 min-w-[4.5rem]">
            <span
              className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${getConnectionRenewalStatusBadgeClass(row.status)}`}
            >
              {CONNECTION_RENEWAL_STATUS_LABELS[row.status]}
            </span>
            <div className="flex items-center gap-1">{renderActions(row)}</div>
          </div>
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
          placeholder="Buscar cliente, MAC ou servidor..."
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
