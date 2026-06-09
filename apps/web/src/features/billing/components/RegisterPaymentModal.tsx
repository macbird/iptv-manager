import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, CreditCard, FileText, User } from 'lucide-react';
import { FormModal } from '../../../shared/ui/modals/FormModal';
import { FormField } from '../../../shared/ui/forms/FormField';
import { FormInput } from '../../../shared/ui/forms/FormInput';
import { FormSelect } from '../../../shared/ui/forms/FormSelect';
import { AsyncSearchSelect } from '../../../shared/ui/forms/AsyncSearchSelect';
import { formTextareaClass } from '../../../shared/ui/forms/form-styles';
import { customersApi } from '../../customers/api/customers.api';
import { tenantBillingApi } from '../api/billing.api';
import { mapCustomersToSearchOptions } from '../utils/customer-search-options';
import { formatCents } from '../../../shared/ui/billing/format-billing';
import {
  BILLING_INVOICE_STATUS_LABELS,
  MANUAL_PAYMENT_METHOD_LABELS,
  MANUAL_PAYMENT_METHOD_VALUES,
  type BillingInvoiceStatusValue,
  type ManualPaymentMethodValue,
  type RegisterPaymentInput,
} from '@client-manager/shared';

interface RegisterPaymentModalProps {
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (invoiceId: string, payload: RegisterPaymentInput) => void;
}

function todayDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatInvoiceOptionLabel(invoice: {
  billingCycleKey: string;
  amountCents: number;
  status: string;
  dueDate: string;
}) {
  const statusLabel =
    BILLING_INVOICE_STATUS_LABELS[invoice.status as BillingInvoiceStatusValue] ?? invoice.status;
  const dueLabel = new Date(invoice.dueDate).toLocaleDateString('pt-BR');
  return `${invoice.billingCycleKey} · ${formatCents(invoice.amountCents)} · ${statusLabel} · venc. ${dueLabel}`;
}

export const RegisterPaymentModal: React.FC<RegisterPaymentModalProps> = ({
  isOpen,
  isPending,
  onClose,
  onSubmit,
}) => {
  const [customerId, setCustomerId] = React.useState('');
  const [customerLabel, setCustomerLabel] = React.useState('');
  const [invoiceId, setInvoiceId] = React.useState('');
  const [method, setMethod] = React.useState<ManualPaymentMethodValue>('pix');
  const [notes, setNotes] = React.useState('');
  const [paidAt, setPaidAt] = React.useState('');

  const searchCustomers = React.useCallback(async (query: string) => {
    const page = await customersApi.list({
      page: 1,
      pageSize: 20,
      filter: query,
      selectableOnly: true,
    });
    return mapCustomersToSearchOptions(page.data);
  }, []);

  const { data: payableInvoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices', 'payable-for-payment', customerId],
    queryFn: () =>
      tenantBillingApi.listInvoices({
        page: 1,
        pageSize: 50,
        filter: '',
        payableOnly: true,
        filters: { customerId },
      }),
    enabled: isOpen && Boolean(customerId),
  });

  React.useEffect(() => {
    if (!isOpen) return;
    setCustomerId('');
    setCustomerLabel('');
    setInvoiceId('');
    setMethod('pix');
    setNotes('');
    setPaidAt(todayDateInputValue());
  }, [isOpen]);

  React.useEffect(() => {
    setInvoiceId('');
  }, [customerId]);

  React.useEffect(() => {
    if (!payableInvoices?.data.length || invoiceId) return;
    setInvoiceId(payableInvoices.data[0].id);
  }, [payableInvoices, invoiceId]);

  const selectedInvoice = payableInvoices?.data.find((invoice) => invoice.id === invoiceId);
  const hasPayableInvoices = Boolean(payableInvoices?.data.length);

  const handleSave = () => {
    if (!invoiceId) return;
    onSubmit(invoiceId, {
      method,
      notes: notes.trim() || undefined,
      paidAt: new Date(`${paidAt || todayDateInputValue()}T12:00:00`).toISOString(),
    });
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar pagamento"
      size="md"
      isPending={isPending}
      saveLabel="Registrar pagamento"
      pendingLabel="Registrando..."
      saveDisabled={!customerId || !invoiceId || !hasPayableInvoices}
      onSave={handleSave}
    >
      <div className="space-y-4">
        <AsyncSearchSelect
          label="Cliente"
          prefixIcon={User}
          value={customerId}
          selectedLabel={customerLabel}
          onChange={(id, option) => {
            setCustomerId(id);
            setCustomerLabel(option?.label ?? '');
          }}
          onSearch={searchCustomers}
          placeholder="Buscar cliente por nome ou telefone..."
          emptyMessage="Nenhum cliente encontrado"
        />

        {!customerId ? (
          <p className="text-sm text-slate-500">Selecione um cliente para ver as faturas pendentes.</p>
        ) : loadingInvoices ? (
          <p className="text-sm text-slate-500">Carregando faturas pendentes...</p>
        ) : !hasPayableInvoices ? (
          <p className="text-sm text-slate-500">
            Nenhuma fatura pendente (em aberto ou vencida) para este cliente.
          </p>
        ) : payableInvoices!.data.length === 1 ? (
          <FormField label="Fatura" prefixIcon={FileText}>
            <p className="rounded-[10px] bg-form-field px-4 py-3 text-sm text-slate-800">
              {formatInvoiceOptionLabel(payableInvoices!.data[0])}
            </p>
          </FormField>
        ) : (
          <FormSelect
            label="Fatura"
            prefixIcon={FileText}
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
          >
            {payableInvoices!.data.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {formatInvoiceOptionLabel(invoice)}
              </option>
            ))}
          </FormSelect>
        )}

        {selectedInvoice ? (
          <p className="text-xs text-slate-500">
            Vencimento: {new Date(selectedInvoice.dueDate).toLocaleDateString('pt-BR')}
          </p>
        ) : null}

        {hasPayableInvoices ? (
          <>
            <FormSelect
              label="Método"
              prefixIcon={CreditCard}
              value={method}
              onChange={(e) => setMethod(e.target.value as ManualPaymentMethodValue)}
            >
              {MANUAL_PAYMENT_METHOD_VALUES.map((value) => (
                <option key={value} value={value}>
                  {MANUAL_PAYMENT_METHOD_LABELS[value]}
                </option>
              ))}
            </FormSelect>

            <FormInput
              label="Data do pagamento"
              prefixIcon={Calendar}
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />

            <FormField label="Observações (opcional)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={500}
                className={formTextareaClass}
              />
            </FormField>
          </>
        ) : null}
      </div>
    </FormModal>
  );
};
