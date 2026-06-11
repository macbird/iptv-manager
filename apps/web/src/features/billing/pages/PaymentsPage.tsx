import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { platformBillingApi, tenantBillingApi } from '../api/billing.api';
import { RegisterPaymentModal } from '../components/RegisterPaymentModal';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { PageHeaderActions } from '../../../shared/ui/layout/PageHeaderActions';
import { ListPagination } from '../../../shared/ui/lists/ListPagination';
import { ResponsiveDataGrid } from '../../../shared/ui/layout/ResponsiveDataGrid';
import { usePaginatedList } from '../../../shared/hooks/usePaginatedList';
import { useListFilterModal } from '../../../shared/hooks/useListFilterModal';
import { ListFiltersModal } from '../../../shared/ui/lists/ListFiltersModal';
import { PAYMENT_FILTER_FIELDS } from '../../../shared/ui/lists/list-filter-fields';
import type { PaymentListItem, RegisterPaymentInput } from '@client-manager/shared';
import { getApiErrorMessage } from '@client-manager/shared';
import { showToast } from '../../../shared/utils/toast';

interface PaymentsPageProps {
  variant: 'admin' | 'tenant';
}

function formatBrl(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({ variant }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const api = variant === 'admin' ? platformBillingApi : tenantBillingApi;
  const title = variant === 'admin' ? 'Pagamentos SaaS' : 'Pagamentos';
  const basePath = variant === 'admin' ? '/admin' : '';
  const [registerOpen, setRegisterOpen] = React.useState(false);

  const registerMutation = useMutation({
    mutationFn: ({ invoiceId, payload }: { invoiceId: string; payload: RegisterPaymentInput }) =>
      tenantBillingApi.registerPayment(invoiceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['activations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setRegisterOpen(false);
      showToast.success('Pagamento registrado');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      showToast.error(getApiErrorMessage(err, 'Erro ao registrar pagamento'));
    },
  });

  const { items, total, totalPages, page, pageSize, filters, setFilters, clearFilters, activeFilterCount, goToPreviousPage, goToNextPage, isLoading } =
    usePaginatedList<PaymentListItem>({
      queryKey: variant === 'admin' ? ['admin-payments'] : ['payments'],
      queryFn: (params) => api.listPayments(params),
    });

  const filterModal = useListFilterModal(filters, setFilters, clearFilters);

  const columns = [
    ...(variant === 'admin'
      ? [
          {
            header: 'Conta',
            accessor: (p: PaymentListItem) => p.invoice.accountName ?? '-',
            width: '25%',
          },
        ]
      : [
          {
            header: 'Cliente',
            accessor: (p: PaymentListItem) => p.invoice.customerName ?? '-',
            width: '25%',
          },
        ]),
    {
      header: 'Ciclo',
      accessor: (p: PaymentListItem) => p.invoice.billingCycleKey,
      width: '15%',
    },
    {
      header: 'Valor',
      accessor: (p: PaymentListItem) => formatBrl(p.amountCents),
      width: '15%',
    },
    { header: 'Método', accessor: (p: PaymentListItem) => p.method.toUpperCase(), width: '12%' },
    {
      header: 'Data',
      accessor: (p: PaymentListItem) => new Date(p.paidAt).toLocaleDateString('pt-BR'),
      width: '15%',
    },
  ];

  const renderMobileCard = (p: PaymentListItem) => (
    <div className="flex items-center justify-between py-1">
      <div className="min-w-0 flex-1 overflow-hidden pl-2">
        <div className="truncate text-sm font-bold text-slate-900">
          {variant === 'admin' ? p.invoice.accountName : p.invoice.customerName}
        </div>
        <div className="truncate text-[10px] text-slate-400">
          {p.invoice.billingCycleKey} · {p.method.toUpperCase()}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 w-[55%]">
        <div className="min-w-0 flex-1 text-center">
          <div className="text-sm font-semibold text-emerald-700">{formatBrl(p.amountCents)}</div>
          <div className="text-[10px] text-slate-400">
            {new Date(p.paidAt).toLocaleDateString('pt-BR')}
          </div>
        </div>
        <span className="w-16 shrink-0" aria-hidden />
      </div>
    </div>
  );

  return (
    <PageLayout
      title={title}
      noPadding
      actions={
        <PageHeaderActions
          onSearch={() => undefined}
          currentFilter=""
          showSearch={false}
          onOpenFilters={filterModal.open}
          activeFilterCount={activeFilterCount}
          primaryAction={
            variant === 'tenant'
              ? {
                  label: 'Novo',
                  onClick: () => setRegisterOpen(true),
                }
              : undefined
          }
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
        mobileHeaderTitles={['Ref', 'Valor']}
        isLoading={isLoading}
        onRowClick={(p) => navigate(`${basePath}/payments/${p.id}`)}
      />

      <ListFiltersModal
        isOpen={filterModal.isOpen}
        onClose={() => filterModal.setIsOpen(false)}
        fields={PAYMENT_FILTER_FIELDS}
        draft={filterModal.draft}
        onDraftChange={filterModal.setDraft}
        onApply={filterModal.apply}
        onClear={filterModal.clear}
      />

      {variant === 'tenant' ? (
        <RegisterPaymentModal
          isOpen={registerOpen}
          isPending={registerMutation.isPending}
          onClose={() => setRegisterOpen(false)}
          onSubmit={(invoiceId, payload) => registerMutation.mutate({ invoiceId, payload })}
        />
      ) : null}
    </PageLayout>
  );
};
