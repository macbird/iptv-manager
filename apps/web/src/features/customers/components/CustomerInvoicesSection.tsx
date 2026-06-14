import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BILLING_INVOICE_STATUS_LABELS,
  getBillingInvoiceStatusBadgeClass,
  type InvoiceListItem,
} from '@client-manager/shared';
import { tenantBillingApi } from '../../billing/api/billing.api';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';

interface CustomerInvoicesSectionProps {
  customerId: string;
}

function formatBrl(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export const CustomerInvoicesSection: React.FC<CustomerInvoicesSectionProps> = ({
  customerId,
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ['customer-invoices', customerId],
    queryFn: () =>
      tenantBillingApi.listCustomerInvoices(customerId, { page: 1, pageSize: 10, filter: '' }),
    enabled: Boolean(customerId),
  });

  if (isLoading) {
    return (
      <div className="relative h-16">
        <LoadingSpinner />
      </div>
    );
  }

  const invoices = data?.data ?? [];

  return (
    <div className="border-t border-slate-200 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-900">Faturas do cliente</h3>
        <Link to="/invoices" className="text-xs font-medium text-form-primary hover:text-form-primary-hover">
          Ver todas
        </Link>
      </div>
      {invoices.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma fatura registrada para este cliente.</p>
      ) : (
        <ul className="space-y-2">
          {invoices.map((invoice: InvoiceListItem) => (
            <li
              key={invoice.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            >
              <div>
                <Link
                  to={`/invoices/${invoice.id}`}
                  className="font-medium text-form-primary hover:underline"
                >
                  {invoice.billingCycleKey}
                </Link>
                <span className="mx-2 text-slate-300">·</span>
                <span className="text-slate-700">{formatBrl(invoice.amountCents)}</span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${getBillingInvoiceStatusBadgeClass(invoice.status)}`}
              >
                {BILLING_INVOICE_STATUS_LABELS[invoice.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
