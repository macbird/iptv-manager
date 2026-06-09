export const PAYMENT_PROVIDER_VALUES = ['asaas', 'efi', 'mercadopago'] as const;
export type PaymentProviderValue = (typeof PAYMENT_PROVIDER_VALUES)[number];

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProviderValue, string> = {
  asaas: 'Asaas',
  efi: 'Efi (Gerencianet)',
  mercadopago: 'Mercado Pago',
};

export const WHATSAPP_PROVIDER_VALUES = ['evolution', 'meta'] as const;
export type WhatsAppProviderValue = (typeof WHATSAPP_PROVIDER_VALUES)[number];

export const WHATSAPP_PROVIDER_LABELS: Record<WhatsAppProviderValue, string> = {
  evolution: 'Evolution API',
  meta: 'WhatsApp Business (Meta)',
};

export const BILLING_SCOPE_VALUES = ['platform', 'tenant'] as const;
export type BillingScopeValue = (typeof BILLING_SCOPE_VALUES)[number];

export const BILLING_INVOICE_STATUS_VALUES = [
  'draft',
  'open',
  'paid',
  'overdue',
  'canceled',
] as const;
export type BillingInvoiceStatusValue = (typeof BILLING_INVOICE_STATUS_VALUES)[number];

/** Invoice statuses eligible for PIX generation and payment registration. */
export const PAYABLE_INVOICE_STATUSES = ['draft', 'open', 'overdue'] as const satisfies ReadonlyArray<
  BillingInvoiceStatusValue
>;

export function isPayableInvoiceStatus(status: BillingInvoiceStatusValue): boolean {
  return (PAYABLE_INVOICE_STATUSES as readonly string[]).includes(status);
}

export const BILLING_INVOICE_STATUS_LABELS: Record<BillingInvoiceStatusValue, string> = {
  draft: 'Rascunho',
  open: 'Em aberto',
  paid: 'Paga',
  overdue: 'Vencida',
  canceled: 'Cancelada',
};

export function getBillingInvoiceStatusBadgeClass(status: BillingInvoiceStatusValue): string {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-700';
    case 'overdue':
      return 'bg-red-100 text-red-700';
    case 'open':
      return 'bg-amber-100 text-amber-800';
    case 'canceled':
      return 'bg-slate-100 text-slate-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}
