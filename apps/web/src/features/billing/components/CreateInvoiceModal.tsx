import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../../customers/api/customers.api';
import { tenantBillingApi } from '../api/billing.api';
import { FormModal } from '../../../shared/ui/modals/FormModal';
import {
  formInputClass,
  formLabelClass,
  formSelectClass,
  formTextareaClass,
} from '../../../shared/ui/forms/form-styles';
import {
  MANUAL_PAYMENT_METHOD_LABELS,
  MANUAL_PAYMENT_METHOD_VALUES,
  type CreateManualInvoiceInput,
  type ManualPaymentMethodValue,
} from '@client-manager/shared';
import { showToast } from '../../../shared/utils/toast';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const formRef = React.useRef<HTMLFormElement>(null);

  const [customerId, setCustomerId] = React.useState('');
  const [amountReais, setAmountReais] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [billingCycleKey, setBillingCycleKey] = React.useState('');
  const [registerPayment, setRegisterPayment] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<ManualPaymentMethodValue>('pix');
  const [paymentNotes, setPaymentNotes] = React.useState('');

  const { data: customersPage, isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers', 'invoice-form'],
    queryFn: () => customersApi.list({ page: 1, pageSize: 100, filter: '' }),
    enabled: isOpen,
  });

  React.useEffect(() => {
    if (!isOpen) return;
    setCustomerId('');
    setAmountReais('');
    setDueDate('');
    setBillingCycleKey('');
    setRegisterPayment(false);
    setPaymentMethod('pix');
    setPaymentNotes('');
  }, [isOpen]);

  React.useEffect(() => {
    if (!customersPage?.data.length || customerId) return;
    setCustomerId(customersPage.data[0].id);
  }, [customersPage, customerId]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateManualInvoiceInput) => tenantBillingApi.createInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['activations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast.success(registerPayment ? 'Fatura criada e pagamento registrado' : 'Fatura criada');
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      showToast.error(err.response?.data?.message ?? 'Não foi possível criar a fatura');
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = Number.parseFloat(amountReais.replace(',', '.'));
    if (!customerId) {
      showToast.error('Selecione um cliente');
      return;
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      showToast.error('Informe um valor válido');
      return;
    }
    if (!dueDate) {
      showToast.error('Informe o vencimento');
      return;
    }

    createMutation.mutate({
      customerId,
      amountCents: Math.round(parsed * 100),
      dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
      billingCycleKey: billingCycleKey.trim() || undefined,
      registerPayment,
      paymentMethod: registerPayment ? paymentMethod : undefined,
      paymentNotes: registerPayment ? paymentNotes.trim() || undefined : undefined,
    });
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova fatura"
      size="lg"
      isPending={createMutation.isPending}
      saveLabel="Criar fatura"
      onSave={() => formRef.current?.requestSubmit()}
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className={formLabelClass}>Cliente</span>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            disabled={loadingCustomers}
            className={formSelectClass}
          >
            {customersPage?.data.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={formLabelClass}>Valor (R$)</span>
          <input
            type="text"
            inputMode="decimal"
            value={amountReais}
            onChange={(e) => setAmountReais(e.target.value)}
            className={formInputClass}
            placeholder="0,00"
          />
        </label>

        <label className="block">
          <span className={formLabelClass}>Vencimento</span>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={formInputClass} />
        </label>

        <label className="block">
          <span className={formLabelClass}>Ciclo (YYYY-MM, opcional)</span>
          <input
            type="text"
            value={billingCycleKey}
            onChange={(e) => setBillingCycleKey(e.target.value)}
            placeholder="2026-06"
            className={formInputClass}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={registerPayment}
            onChange={(e) => setRegisterPayment(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600"
          />
          Registrar pagamento antecipado/manual agora
        </label>

        {registerPayment ? (
          <div className="space-y-4 rounded-md border border-slate-100 bg-slate-50 p-4">
            <label className="block">
              <span className={formLabelClass}>Método</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as ManualPaymentMethodValue)}
                className={`${formSelectClass} bg-white`}
              >
                {MANUAL_PAYMENT_METHOD_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {MANUAL_PAYMENT_METHOD_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={formLabelClass}>Observações do pagamento</span>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={2}
                maxLength={500}
                className={`${formTextareaClass} bg-white`}
              />
            </label>
          </div>
        ) : null}
      </form>
    </FormModal>
  );
};
