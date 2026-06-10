import { z } from 'zod';
import { chargeMessageSettingsSchema } from './charge-message';

export const billingAutomationSettingsSchema = z.object({
  active: z.boolean(),
  daysBeforeDue: z.number().int().min(0).max(30),
  sendWhatsapp: z.boolean(),
  sendPaymentCharge: z.boolean(),
  automationRunHour: z.number().int().min(0).max(23),
  automationRunMinute: z.number().int().min(0).max(59),
  autoCloseSubscriptionInvoices: z.boolean(),
  closeSubscriptionInvoiceAfterDays: z.number().int().min(1).max(365),
});

export type BillingAutomationSettingsInput = z.infer<typeof billingAutomationSettingsSchema>;

export interface BillingAutomationSettingsDto extends BillingAutomationSettingsInput {}

export const tenantChargeMessagesSettingsSchema = z.object({
  subscription: chargeMessageSettingsSchema,
  oneOff: chargeMessageSettingsSchema,
});

export type TenantChargeMessagesSettingsInput = z.infer<typeof tenantChargeMessagesSettingsSchema>;

export interface TenantChargeMessagesSettingsDto {
  subscription: { templates: string[]; delayMs: number };
  oneOff: { templates: string[]; delayMs: number };
}

export const updateInvoiceChargeMessagesSchema = chargeMessageSettingsSchema;

export type UpdateInvoiceChargeMessagesInput = z.infer<typeof updateInvoiceChargeMessagesSchema>;

export interface InvoiceChargeDeliveryDto {
  id: string;
  channel: string;
  source: string;
  sentAt: string;
  messagesCount: number;
  success: boolean;
  errorMessage: string | null;
}
