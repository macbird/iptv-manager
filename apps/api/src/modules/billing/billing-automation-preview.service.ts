import type {
  BillingAutomationLastRunDto,
  BillingAutomationPreviewAction,
  BillingAutomationPreviewDto,
} from '@client-manager/shared';
import { prisma } from '../../core/database';
import { billingCycleKeyFromDate } from './account-billing.util';
import { startOfUtcDay } from './sync-overdue-invoices';

const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

export interface BillingAutomationPreviewOptions {
  scenario?: 'current' | 'next_scheduled_run';
  timeZone?: string;
}

/**
 * Read-only previews and last-run snapshots for tenant billing automation.
 *
 * @author João Paulo da Silva
 * @since 4.9.0
 * @creationDate 12/06/2026
 * Copyright (c) 2026 NTT DATA Brasil Consultologia de Negócio e Tecnologia da Informação Ltda.
 * Todos os direitos reservados.
 */
export class BillingAutomationPreviewService {
  /**
   * Returns the last automation run snapshot persisted for the tenant.
   */
  async getLastRun(accountId: string): Promise<BillingAutomationLastRunDto> {
    const config = await prisma.tenantBillingAutomationConfig.findUnique({
      where: { accountId },
      select: { lastAutomationRunAt: true, lastAutomationRunSummary: true },
    });

    if (!config?.lastAutomationRunAt) {
      return emptyLastRun();
    }

    const summary = parseLastRunSummary(config.lastAutomationRunSummary);

    return {
      runAt: config.lastAutomationRunAt.toISOString(),
      customersScanned: summary.customersScanned,
      invoicesCreated: summary.invoicesCreated,
      invoicesAutoClosed: summary.invoicesAutoClosed,
      chargesSent: summary.chargesSent,
      chargesSkipped: summary.chargesSkipped,
      overdueRemindersSent: summary.overdueRemindersSent,
      overdueRemindersFailed: summary.overdueRemindersFailed,
      overdueRemindersSkippedBlocked: summary.overdueRemindersSkippedBlocked,
      overdueRemindersSkippedNoPix: summary.overdueRemindersSkippedNoPix,
      tenantReportSent: summary.tenantReportSent,
      errorsCount: summary.errorsCount,
      errors: summary.errors,
    };
  }

  /**
   * Dry-run preview of customers in the D-N window for the current moment or next scheduled run.
   */
  async getPreview(
    accountId: string,
    options?: BillingAutomationPreviewOptions,
  ): Promise<BillingAutomationPreviewDto> {
    const timeZone = options?.timeZone ?? DEFAULT_TIMEZONE;
    const scenario = options?.scenario ?? 'next_scheduled_run';

    const config = await prisma.tenantBillingAutomationConfig.findUnique({
      where: { accountId },
    });

    if (!config) {
      return emptyPreview(scenario, new Date(), null, 3, false, true);
    }

    const referenceAt =
      scenario === 'next_scheduled_run'
        ? computeNextScheduledRunAt(config.automationRunHour, timeZone)
        : new Date();

    const nextScheduledRunAt =
      scenario === 'next_scheduled_run'
        ? referenceAt
        : computeNextScheduledRunAt(config.automationRunHour, timeZone);

    if (!config.active) {
      return emptyPreview(
        scenario,
        referenceAt,
        nextScheduledRunAt,
        config.daysBeforeDue,
        false,
        config.sendWhatsapp,
      );
    }

    const today = startOfUtcDay(referenceAt);
    const windowEnd = addUtcDays(today, config.daysBeforeDue);

    const customers = await prisma.customer.findMany({
      where: {
        tenantId: accountId,
        status: 'active',
        expiresAt: {
          gte: today,
          lte: windowEnd,
        },
      },
      include: { plan: true },
      orderBy: { expiresAt: 'asc' },
    });

    const previewCustomers = [];

    for (const customer of customers) {
      if (!customer.expiresAt) continue;

      const billingCycleKey = billingCycleKeyFromDate(customer.expiresAt);
      const invoice = await prisma.invoice.findFirst({
        where: {
          scope: 'tenant',
          accountId,
          customerId: customer.id,
          kind: 'subscription',
          billingCycleKey,
          status: { not: 'canceled' },
        },
        select: { id: true },
      });

      const alreadySent = invoice
        ? await prisma.invoiceChargeDelivery.findFirst({
            where: {
              invoiceId: invoice.id,
              success: true,
              source: { in: ['manual', 'automation'] },
            },
            select: { id: true },
          })
        : null;

      const amountCents =
        customer.plan && Number.isFinite(Number(customer.plan.price))
          ? Math.round(Number(customer.plan.price) * 100)
          : null;

      const action = resolvePreviewAction({
        sendWhatsapp: config.sendWhatsapp,
        hasInvoice: Boolean(invoice),
        alreadyCharged: Boolean(alreadySent),
        hasValidPlan: Boolean(customer.plan && amountCents && amountCents > 0),
      });

      previewCustomers.push({
        customerId: customer.id,
        customerName: customer.name,
        expiresAt: customer.expiresAt.toISOString(),
        billingCycleKey,
        amountCents,
        hasInvoice: Boolean(invoice),
        alreadyCharged: Boolean(alreadySent),
        action,
      });
    }

    const totals = summarizePreview(previewCustomers);

    return {
      scenario,
      referenceAt: referenceAt.toISOString(),
      nextScheduledRunAt: nextScheduledRunAt.toISOString(),
      windowDaysBeforeDue: config.daysBeforeDue,
      automationActive: config.active,
      sendWhatsapp: config.sendWhatsapp,
      customers: previewCustomers,
      totals,
    };
  }
}

/**
 * Computes the next hourly automation run at the tenant-configured hour (SP timezone).
 */
export function computeNextScheduledRunAt(
  automationRunHour: number,
  timeZone: string = DEFAULT_TIMEZONE,
  from: Date = new Date(),
): Date {
  const candidate = new Date(from);
  candidate.setUTCMinutes(0, 0, 0);

  for (let step = 0; step < 48; step += 1) {
    if (getZonedHour(candidate, timeZone) === automationRunHour && candidate.getTime() > from.getTime()) {
      return candidate;
    }
    candidate.setTime(candidate.getTime() + 60 * 60 * 1000);
  }

  return new Date(from.getTime() + 24 * 60 * 60 * 1000);
}

function getZonedHour(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(date);

  return Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
}

function resolvePreviewAction(params: {
  sendWhatsapp: boolean;
  hasInvoice: boolean;
  alreadyCharged: boolean;
  hasValidPlan: boolean;
}): BillingAutomationPreviewAction {
  if (!params.hasValidPlan) {
    return 'skip_inactive';
  }
  if (!params.sendWhatsapp) {
    return params.hasInvoice ? 'skip_whatsapp_disabled' : 'create_invoice_only';
  }
  if (params.alreadyCharged) {
    return 'skip_already_sent';
  }
  if (params.hasInvoice) {
    return 'send_charge';
  }
  return 'create_invoice_and_send';
}

function summarizePreview(
  customers: BillingAutomationPreviewDto['customers'],
): BillingAutomationPreviewDto['totals'] {
  return {
    inWindow: customers.length,
    willSendCharge: customers.filter(
      (item) => item.action === 'send_charge' || item.action === 'create_invoice_and_send',
    ).length,
    willCreateInvoice: customers.filter(
      (item) => item.action === 'create_invoice_and_send' || item.action === 'create_invoice_only',
    ).length,
    willSkipAlreadySent: customers.filter((item) => item.action === 'skip_already_sent').length,
    willSkipWhatsappDisabled: customers.filter(
      (item) => item.action === 'skip_whatsapp_disabled',
    ).length,
  };
}

function parseLastRunSummary(value: unknown): Omit<BillingAutomationLastRunDto, 'runAt'> {
  if (!value || typeof value !== 'object') {
    return emptyLastRunSummary();
  }

  const record = value as Record<string, unknown>;
  const errors = Array.isArray(record.errors)
    ? record.errors.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    customersScanned: Number(record.customersScanned ?? 0),
    invoicesCreated: Number(record.invoicesCreated ?? 0),
    invoicesAutoClosed: Number(record.invoicesAutoClosed ?? 0),
    chargesSent: Number(record.chargesSent ?? 0),
    chargesSkipped: Number(record.chargesSkipped ?? 0),
    overdueRemindersSent: Number(record.overdueRemindersSent ?? 0),
    overdueRemindersFailed: Number(record.overdueRemindersFailed ?? 0),
    overdueRemindersSkippedBlocked: Number(record.overdueRemindersSkippedBlocked ?? 0),
    overdueRemindersSkippedNoPix: Number(record.overdueRemindersSkippedNoPix ?? 0),
    tenantReportSent: Boolean(record.tenantReportSent),
    errorsCount: Number(record.errorsCount ?? errors.length),
    errors,
  };
}

function emptyLastRunSummary(): Omit<BillingAutomationLastRunDto, 'runAt'> {
  return {
    customersScanned: 0,
    invoicesCreated: 0,
    invoicesAutoClosed: 0,
    chargesSent: 0,
    chargesSkipped: 0,
    overdueRemindersSent: 0,
    overdueRemindersFailed: 0,
    overdueRemindersSkippedBlocked: 0,
    overdueRemindersSkippedNoPix: 0,
    tenantReportSent: false,
    errorsCount: 0,
    errors: [],
  };
}

function emptyLastRun(): BillingAutomationLastRunDto {
  return {
    runAt: null,
    ...emptyLastRunSummary(),
  };
}

function emptyPreview(
  scenario: BillingAutomationPreviewDto['scenario'],
  referenceAt: Date,
  nextScheduledRunAt: Date | null,
  windowDaysBeforeDue: number,
  automationActive: boolean,
  sendWhatsapp: boolean,
): BillingAutomationPreviewDto {
  return {
    scenario,
    referenceAt: referenceAt.toISOString(),
    nextScheduledRunAt: nextScheduledRunAt?.toISOString() ?? null,
    windowDaysBeforeDue,
    automationActive,
    sendWhatsapp,
    customers: [],
    totals: {
      inWindow: 0,
      willSendCharge: 0,
      willCreateInvoice: 0,
      willSkipAlreadySent: 0,
      willSkipWhatsappDisabled: 0,
    },
  };
}

function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
