import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, CalendarRange, CreditCard, FileText, User } from 'lucide-react';
import { customersApi } from '../../customers/api/customers.api';
import { tenantBillingApi } from '../api/billing.api';
import {
  formatPlanPriceSuggestion,
  mapCustomersToSearchOptions,
} from '../utils/customer-search-options';
import { FormModal } from '../../../shared/ui/modals/FormModal';
import { FormField } from '../../../shared/ui/forms/FormField';
import { FormCurrencyInput } from '../../../shared/ui/forms/FormCurrencyInput';
import { FormInput } from '../../../shared/ui/forms/FormInput';
import { FormSelect } from '../../../shared/ui/forms/FormSelect';
import { AsyncSearchSelect } from '../../../shared/ui/forms/AsyncSearchSelect';
import { formTextareaClass } from '../../../shared/ui/forms/form-styles';
import {
  INVOICE_KIND_LABELS,
  INVOICE_KIND_VALUES,
  MANUAL_PAYMENT_METHOD_LABELS,
  MANUAL_PAYMENT_METHOD_VALUES,
  type CreateManualInvoiceInput,
  type InvoiceKindValue,
  type ManualPaymentMethodValue,
} from '@client-manager/shared';
import { getApiErrorMessage } from '@client-manager/shared';
import { showToast } from '../../../shared/utils/toast';
import { ChargeMessageTemplatesSection } from '../../settings/components/ChargeMessageTemplatesSection';
import {
  DEFAULT_ONE_OFF_CHARGE_MESSAGE_TEMPLATES,
  DEFAULT_CHARGE_MESSAGE_DELAY_MS,
} from '@client-manager/shared';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const formRef = React.useRef<HTMLFormElement>(null);

  const [customerId, setCustomerId] = React.useState('');
  const [customerLabel, setCustomerLabel] = React.useState('');
  const [kind, setKind] = React.useState<InvoiceKindValue>('subscription');
  const [description, setDescription] = React.useState('');
  const [amountReais, setAmountReais] = React.useState<number | null>(null);
  const [dueDate, setDueDate] = React.useState('');
  const [billingCycleKey, setBillingCycleKey] = React.useState('');
  const [registerPayment, setRegisterPayment] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<ManualPaymentMethodValue>('pix');
  const [paymentNotes, setPaymentNotes] = React.useState('');
  const [chargeMessages, setChargeMessages] = React.useState({
    templates: [...DEFAULT_ONE_OFF_CHARGE_MESSAGE_TEMPLATES],
    delayMs: DEFAULT_CHARGE_MESSAGE_DELAY_MS,
  });

  const searchCustomers = React.useCallback(async (query: string) => {
    const page = await customersApi.list({
      page: 1,
      pageSize: 20,
      filter: query,
      selectableOnly: true,
    });
    return mapCustomersToSearchOptions(page.data);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    setCustomerId('');
    setCustomerLabel('');
    setKind('subscription');
    setDescription('');
    setAmountReais(null);
    setDueDate('');
    setBillingCycleKey('');
    setRegisterPayment(false);
    setPaymentMethod('pix');
    setPaymentNotes('');
    setChargeMessages({
      templates: [...DEFAULT_ONE_OFF_CHARGE_MESSAGE_TEMPLATES],
      delayMs: DEFAULT_CHARGE_MESSAGE_DELAY_MS,
    });
  }, [isOpen]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateManualInvoiceInput) => tenantBillingApi.createInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['activations'] });
      showToast.success('Fatura criada');
      onClose();
    },
    onError: (err: unknown) => showToast.error(getApiErrorMessage(err, 'Erro ao criar fatura')),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      showToast.error('Selecione um cliente');
      return;
    }
    if (kind === 'one_off' && !description.trim()) {
      showToast.error('Informe a descrição da cobrança avulsa');
      return;
    }
    if (amountReais == null) {
      showToast.error('Informe o valor');
      return;
    }
    if (!Number.isFinite(amountReais) || amountReais <= 0) {
      showToast.error('Informe um valor válido');
      return;
    }
    if (!dueDate) {
      showToast.error('Informe o vencimento');
      return;
    }

    createMutation.mutate({
      customerId,
      kind,
      description: kind === 'one_off' ? description.trim() : undefined,
      amountCents: Math.round(amountReais * 100),
      dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
      billingCycleKey: kind === 'subscription' ? billingCycleKey.trim() || undefined : undefined,
      chargeMessages: kind === 'one_off' ? chargeMessages : undefined,
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
        <FormSelect
          label="Tipo de fatura"
          prefixIcon={FileText}
          value={kind}
          onChange={(e) => setKind(e.target.value as InvoiceKindValue)}
        >
          {INVOICE_KIND_VALUES.map((value) => (
            <option key={value} value={value}>
              {INVOICE_KIND_LABELS[value]}
            </option>
          ))}
        </FormSelect>

        <AsyncSearchSelect
          label="Cliente"
          prefixIcon={User}
          value={customerId}
          selectedLabel={customerLabel}
          onChange={(id, option) => {
            setCustomerId(id);
            setCustomerLabel(option?.label ?? '');
            const suggested = formatPlanPriceSuggestion(option?.meta?.planPrice);
            if (suggested) {
              setAmountReais(suggested);
            }
          }}
          onSearch={searchCustomers}
          placeholder="Buscar cliente por nome ou telefone..."
          emptyMessage="Nenhum cliente encontrado"
        />

        {kind === 'one_off' ? (
          <FormField label="Descrição da cobrança">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              className={formTextareaClass}
              placeholder="Ex.: Instalação de decoder, pacote extra..."
            />
          </FormField>
        ) : null}

        <FormCurrencyInput label="Valor" value={amountReais} onChange={setAmountReais} />

        <FormInput
          label="Vencimento"
          prefixIcon={Calendar}
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        {kind === 'subscription' ? (
          <FormInput
            label="Ciclo (YYYY-MM, opcional)"
            prefixIcon={CalendarRange}
            type="text"
            value={billingCycleKey}
            onChange={(e) => setBillingCycleKey(e.target.value)}
            placeholder="2026-06"
          />
        ) : (
          <ChargeMessageTemplatesSection
            title="Mensagens WhatsApp desta cobrança"
            value={chargeMessages}
            onChange={setChargeMessages}
          />
        )}

        <label className="flex items-center gap-2.5 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={registerPayment}
            onChange={(e) => setRegisterPayment(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-form-primary focus:ring-form-primary/30"
          />
          Registrar pagamento antecipado/manual agora
        </label>

        {registerPayment ? (
          <div className="space-y-4 rounded-[10px] bg-form-field/60 p-4">
            <FormSelect
              label="Método"
              prefixIcon={CreditCard}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as ManualPaymentMethodValue)}
            >
              {MANUAL_PAYMENT_METHOD_VALUES.map((value) => (
                <option key={value} value={value}>
                  {MANUAL_PAYMENT_METHOD_LABELS[value]}
                </option>
              ))}
            </FormSelect>
            <FormField label="Observações do pagamento">
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={2}
                maxLength={500}
                className={formTextareaClass}
              />
            </FormField>
          </div>
        ) : null}
      </form>
    </FormModal>
  );
};
