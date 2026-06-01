import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText } from 'lucide-react';
import { platformBillingApi, tenantBillingApi } from '../api/billing.api';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import { DetailGrid, DetailItem, DetailSection } from '../components/BillingDetailFields';
import { formatCents, formatPaymentMethod } from '../../../shared/ui/billing/format-billing';
import {
  BILLING_INVOICE_STATUS_LABELS,
  getBillingInvoiceStatusBadgeClass,
  type BillingInvoiceStatusValue,
} from '@client-manager/shared';

interface PaymentDetailPageProps {
  variant: 'admin' | 'tenant';
}

export const PaymentDetailPage: React.FC<PaymentDetailPageProps> = ({ variant }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const api = variant === 'admin' ? platformBillingApi : tenantBillingApi;
  const basePath = variant === 'admin' ? '/admin' : '';

  const { data: payment, isLoading, isError } = useQuery({
    queryKey: variant === 'admin' ? ['admin-payment', id] : ['payment', id],
    queryFn: () => api.getPayment(id!),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <PageLayout title="Pagamento">
        <div className="relative h-64">
          <LoadingSpinner />
        </div>
      </PageLayout>
    );
  }

  if (isError || !payment) {
    return (
      <PageLayout title="Pagamento">
        <p className="text-sm text-slate-600">Pagamento não encontrado.</p>
        <button
          type="button"
          onClick={() => navigate(`${basePath}/payments`)}
          className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          Voltar para pagamentos
        </button>
      </PageLayout>
    );
  }

  const inv = payment.invoice;
  const invoiceStatusLabel =
    BILLING_INVOICE_STATUS_LABELS[inv.status as BillingInvoiceStatusValue] ?? inv.status;

  return (
    <PageLayout
      title="Pagamento"
      footer={
        <button
          type="button"
          onClick={() => navigate(`${basePath}/payments`)}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      }
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <p className="text-2xl font-bold text-emerald-700">{formatCents(payment.amountCents)}</p>

        <DetailSection title="Dados do pagamento">
          <DetailGrid>
            <DetailItem label="Método" value={formatPaymentMethod(payment.method)} />
            <DetailItem
              label="Data do pagamento"
              value={new Date(payment.paidAt).toLocaleString('pt-BR')}
            />
            <DetailItem label="ID do pagamento" value={payment.id} className="sm:col-span-2" />
            {payment.providerPaymentId ? (
              <DetailItem
                label="ID no provider"
                value={payment.providerPaymentId}
                className="sm:col-span-2"
              />
            ) : null}
            <DetailItem
              label="Registrado em"
              value={new Date(payment.createdAt).toLocaleString('pt-BR')}
            />
          </DetailGrid>
        </DetailSection>

        <DetailSection title="Fatura vinculada">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <DetailGrid>
                <DetailItem label="Ciclo" value={inv.billingCycleKey} />
                <DetailItem label="Valor da fatura" value={formatCents(inv.amountCents)} />
                <DetailItem
                  label="Vencimento"
                  value={new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                />
                {variant === 'admin' && inv.account ? (
                  <DetailItem label="Conta" value={inv.account.name} />
                ) : null}
                {variant === 'tenant' && inv.customer ? (
                  <DetailItem label="Cliente" value={inv.customer.name} />
                ) : null}
                <DetailItem
                  label="Status da fatura"
                  value={
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getBillingInvoiceStatusBadgeClass(inv.status as BillingInvoiceStatusValue)}`}
                    >
                      {invoiceStatusLabel}
                    </span>
                  }
                />
              </DetailGrid>
            </div>
          </div>
          <Link
            to={`${basePath}/invoices/${inv.id}`}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            <FileText className="h-4 w-4" />
            Ver fatura completa
          </Link>
        </DetailSection>
      </div>
    </PageLayout>
  );
};
