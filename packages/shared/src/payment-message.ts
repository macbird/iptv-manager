export interface PaymentMessageInvoice {
  pixCopyPaste: string | null;
  checkoutUrl?: string | null;
  paymentDeliveryType?: 'emv' | 'checkout_link' | null;
  amountCents: number;
  billingCycleKey: string;
  dueDate: string | Date;
}

/**
 * Returns the payment block text for WhatsApp or UI copy.
 */
export function buildPaymentWhatsAppBlock(invoice: PaymentMessageInvoice): string {
  if (invoice.paymentDeliveryType === 'checkout_link' && invoice.checkoutUrl) {
    return `Pague aqui (PIX ou cartão):\n${invoice.checkoutUrl}`;
  }
  if (invoice.pixCopyPaste) {
    return `PIX copia e cola:\n${invoice.pixCopyPaste}`;
  }
  return 'Pagamento ainda não gerado para esta fatura.';
}
