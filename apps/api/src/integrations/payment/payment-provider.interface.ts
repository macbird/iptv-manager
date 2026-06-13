/** Payment provider contract for PIX EMV and future checkout-link adapters. */

export type PaymentDeliveryType = 'emv' | 'checkout_link';

export interface CreateChargeInput {
  tenantId: string;
  invoiceId: string;
  amountCents: number;
  dueDate: Date;
  payerName: string;
  payerEmail?: string;
  payerPhone?: string;
  payerExternalRef?: string;
  description?: string;
}

export interface PaymentChargeResult {
  providerChargeId: string;
  deliveryType: PaymentDeliveryType;
  copyPasteCode?: string;
  qrCodeBase64?: string;
  checkoutUrl?: string;
  expiresAt?: Date;
}

export interface WebhookPaymentEvent {
  providerChargeId: string;
  amountCents: number;
  paidAt: Date;
  endToEndId?: string;
}

export interface PaymentProvider {
  readonly deliveryType: PaymentDeliveryType;
  createCharge(input: CreateChargeInput): Promise<PaymentChargeResult>;
  parseWebhook?(body: unknown, headers: Record<string, string>): Promise<WebhookPaymentEvent>;
}
