import { z } from 'zod';
import {
  chargeMessageSettingsSchema,
  overdueChargeMessagesSchema,
  type OverdueChargeMessagesDto,
} from './charge-message';
import {
  DEFAULT_OVERDUE_REMINDER_DAYS,
  DEFAULT_OVERDUE_REMINDER_FAILURE_GRACE_DAYS,
  MAX_OVERDUE_REMINDER_WINDOWS,
  normalizeOverdueReminderDays,
} from './overdue-reminder.util';

export const overdueRemindersSettingsSchema = z.object({
  enabled: z.boolean(),
  daysAfterDue: z
    .array(z.number().int().min(1))
    .min(1, 'Informe ao menos uma janela pós-vencimento')
    .max(MAX_OVERDUE_REMINDER_WINDOWS, `Máximo de ${MAX_OVERDUE_REMINDER_WINDOWS} janelas`),
  failureGraceDays: z.number().int().min(0).max(7),
});

export type OverdueRemindersSettingsInput = z.infer<typeof overdueRemindersSettingsSchema>;

export interface OverdueRemindersSettingsDto extends OverdueRemindersSettingsInput {}

export const billingAutomationSettingsSchema = z
  .object({
    active: z.boolean(),
    daysBeforeDue: z.number().int().min(0).max(30),
    sendWhatsapp: z.boolean(),
    sendPaymentCharge: z.boolean(),
    automationRunHour: z.number().int().min(0).max(23),
    automationRunMinute: z.number().int().min(0).max(59),
    autoCloseSubscriptionInvoices: z.boolean(),
    closeSubscriptionInvoiceAfterDays: z.number().int().min(1).max(365),
    overdueReminders: overdueRemindersSettingsSchema,
  })
  .superRefine((value, ctx) => {
    if (!value.overdueReminders.enabled) {
      return;
    }

    const normalized = normalizeOverdueReminderDays(value.overdueReminders.daysAfterDue);
    if (normalized.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe ao menos uma janela válida quando lembretes pós-vencimento estão ativos',
        path: ['overdueReminders', 'daysAfterDue'],
      });
    }
  });

export type BillingAutomationSettingsInput = z.infer<typeof billingAutomationSettingsSchema>;

export interface BillingAutomationSettingsDto extends BillingAutomationSettingsInput {}

export interface BillingAutomationLastRunDto {
  runAt: string | null;
  customersScanned: number;
  invoicesCreated: number;
  invoicesAutoClosed: number;
  chargesSent: number;
  chargesSkipped: number;
  overdueRemindersSent: number;
  overdueRemindersFailed: number;
  overdueRemindersSkippedBlocked: number;
  overdueRemindersSkippedNoPix: number;
  tenantReportSent: boolean;
  errorsCount: number;
  errors: string[];
}

export type BillingAutomationPreviewAction =
  | 'send_charge'
  | 'create_invoice_and_send'
  | 'create_invoice_only'
  | 'skip_already_sent'
  | 'skip_whatsapp_disabled'
  | 'skip_inactive';

export interface BillingAutomationPreviewCustomerDto {
  customerId: string;
  customerName: string;
  expiresAt: string;
  billingCycleKey: string;
  amountCents: number | null;
  hasInvoice: boolean;
  alreadyCharged: boolean;
  action: BillingAutomationPreviewAction;
}

export interface BillingAutomationPreviewDto {
  scenario: 'current' | 'next_scheduled_run';
  referenceAt: string;
  nextScheduledRunAt: string | null;
  windowDaysBeforeDue: number;
  automationActive: boolean;
  sendWhatsapp: boolean;
  customers: BillingAutomationPreviewCustomerDto[];
  totals: {
    inWindow: number;
    willSendCharge: number;
    willCreateInvoice: number;
    willSkipAlreadySent: number;
    willSkipWhatsappDisabled: number;
  };
}

export const DEFAULT_OVERDUE_REMINDERS_SETTINGS: OverdueRemindersSettingsDto = {
  enabled: false,
  daysAfterDue: [...DEFAULT_OVERDUE_REMINDER_DAYS],
  failureGraceDays: DEFAULT_OVERDUE_REMINDER_FAILURE_GRACE_DAYS,
};

export type OverdueChargeMessagesSettingsDto = OverdueChargeMessagesDto;

export const tenantChargeMessagesSettingsSchema = z.object({
  subscription: chargeMessageSettingsSchema,
  oneOff: chargeMessageSettingsSchema,
  overdue: overdueChargeMessagesSchema,
});

export type TenantChargeMessagesSettingsInput = z.infer<typeof tenantChargeMessagesSettingsSchema>;

export interface TenantChargeMessagesSettingsDto {
  subscription: { templates: string[]; delayMs: number };
  oneOff: { templates: string[]; delayMs: number };
  overdue: OverdueChargeMessagesSettingsDto;
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
  windowDaysAfterDue: number | null;
}
