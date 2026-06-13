import {
  DEFAULT_CHARGE_MESSAGE_DELAY_MS,
  DEFAULT_PLATFORM_SAAS_CHARGE_MESSAGE_TEMPLATES,
  parseChargeMessageTemplates,
  type ChargeMessageSettingsDto,
  type PlatformBillingAutomationSettingsDto,
  type PlatformBillingAutomationSettingsInput,
} from '@client-manager/shared';
import { prisma } from '../../core/database';
import {
  advanceNextDueDate,
  billingCycleKeyFromDate,
  dueDayFromDate,
} from './account-billing.util';
import { InvoicesService } from './invoices.service';
import { InvoiceChargeService } from './invoice-charge.service';
import { PaymentGenerationService } from '../../integrations/payment/payment-generation.service';
import { startOfUtcDay } from './sync-overdue-invoices';

const CONFIG_ID = 'default';
const invoicesService = new InvoicesService();
const invoiceChargeService = new InvoiceChargeService();
const paymentGeneration = new PaymentGenerationService();

export interface PlatformBillingAutomationRunSummary {
  invoicesCreated: number;
  chargesSent: number;
  chargesFailed: number;
  accountsSuspended: number;
  errors: string[];
}

/**
 * Platform SaaS billing automation: monthly invoices, PIX generation, and WhatsApp delivery.
 *
 * @author João Paulo da Silva
 * @since 4.9.0
 * @creationDate 12/06/2026

 */
export class PlatformBillingAutomationService {
  /**
   * Returns platform SaaS automation settings including charge message templates.
   */
  async getSettings(): Promise<{
    billingAutomation: PlatformBillingAutomationSettingsDto;
    chargeMessages: ChargeMessageSettingsDto;
  }> {
    const row = await this.ensureRow();
    return {
      billingAutomation: mapPlatformAutomation(row),
      chargeMessages: mapPlatformChargeMessages(row),
    };
  }

  /**
   * Updates platform SaaS automation schedule and suspension policy.
   * Invoice, PIX, and WhatsApp are always enabled when automation runs.
   */
  async updateAutomation(input: PlatformBillingAutomationSettingsInput) {
    await prisma.platformBillingAutomationConfig.update({
      where: { id: CONFIG_ID },
      data: {
        active: input.active,
        sendWhatsapp: true,
        sendPaymentCharge: true,
        automationRunHour: input.automationRunHour,
        automationRunMinute: input.automationRunMinute,
        suspendOverdueAccounts: input.suspendOverdueAccounts,
      },
    });
    return this.getSettings();
  }

  /**
   * Updates WhatsApp charge message templates for SaaS invoices.
   */
  async updateChargeMessages(input: ChargeMessageSettingsDto) {
    await prisma.platformBillingAutomationConfig.update({
      where: { id: CONFIG_ID },
      data: {
        chargeMessageTemplates: input.templates,
        chargeMessageDelayMs: input.delayMs,
      },
    });
    return this.getSettings();
  }

  /**
   * Runs monthly SaaS invoice generation when schedule matches the given clock.
   */
  async runForSchedule(filterByHour?: number, filterByMinute?: number) {
    const config = await this.ensureRow();
    const summary: PlatformBillingAutomationRunSummary = {
      invoicesCreated: 0,
      chargesSent: 0,
      chargesFailed: 0,
      accountsSuspended: 0,
      errors: [],
    };

    if (!config.active) {
      return summary;
    }

    if (filterByHour !== undefined && config.automationRunHour !== filterByHour) {
      return summary;
    }
    if (filterByMinute !== undefined && config.automationRunMinute !== filterByMinute) {
      return summary;
    }

    const today = startOfUtcDay(new Date());

    const subscriptions = await prisma.accountSubscription.findMany({
      where: {
        status: 'active',
        account: { status: 'active' },
        nextDueDate: { lte: today },
      },
      include: {
        account: { select: { id: true, name: true, phone: true } },
        platformPlan: { select: { priceCents: true } },
      },
    });

    for (const subscription of subscriptions) {
      try {
        const dueDate = subscription.nextDueDate;
        const billingCycleKey = billingCycleKeyFromDate(dueDate);

        const existing = await prisma.invoice.findFirst({
          where: {
            scope: 'platform',
            accountId: subscription.accountId,
            billingCycleKey,
            status: { not: 'canceled' },
          },
          select: { id: true },
        });

        if (existing) {
          continue;
        }

        const invoice = await invoicesService.createPlatformFromSubscription({
          accountId: subscription.accountId,
          amountCents: subscription.platformPlan.priceCents,
          dueDate,
          billingCycleKey,
        });
        summary.invoicesCreated += 1;

        try {
          await paymentGeneration.generatePayment(invoice.id);
        } catch (error) {
          summary.errors.push(
            `PIX ${subscription.account.name}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        try {
          await invoiceChargeService.sendChargeViaWhatsApp(invoice.id, undefined, 'automation');
          summary.chargesSent += 1;
        } catch (error) {
          summary.chargesFailed += 1;
          summary.errors.push(
            `WhatsApp ${subscription.account.name}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        const nextDueDate = advanceNextDueDate(dueDate);
        await prisma.accountSubscription.update({
          where: { accountId: subscription.accountId },
          data: {
            nextDueDate,
            dueDay: dueDayFromDate(nextDueDate),
          },
        });
      } catch (error) {
        summary.errors.push(
          `${subscription.account.name}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    if (config.suspendOverdueAccounts) {
      summary.accountsSuspended = await this.suspendOverdueAccounts();
    }

    await prisma.platformBillingAutomationConfig.update({
      where: { id: CONFIG_ID },
      data: {
        lastAutomationRunAt: new Date(),
        lastAutomationRunSummary: summary as object,
      },
    });

    return summary;
  }

  /**
   * Suspends active accounts with platform invoices overdue beyond configured grace days.
   */
  async suspendOverdueAccounts(): Promise<number> {
    const paymentConfig = await prisma.platformPaymentConfig.findUnique({
      where: { id: CONFIG_ID },
    });
    const overdueDays = paymentConfig?.overdueDays ?? 7;
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - overdueDays);

    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        scope: 'platform',
        status: 'overdue',
        dueDate: { lt: cutoff },
        account: { status: 'active' },
      },
      select: { accountId: true },
      distinct: ['accountId'],
    });

    if (overdueInvoices.length === 0) {
      return 0;
    }

    const result = await prisma.account.updateMany({
      where: {
        id: { in: overdueInvoices.map((row) => row.accountId) },
        status: 'active',
      },
      data: { status: 'inactive' },
    });

    return result.count;
  }

  private async ensureRow() {
    return prisma.platformBillingAutomationConfig.upsert({
      where: { id: CONFIG_ID },
      create: { id: CONFIG_ID },
      update: {},
    });
  }
}

function mapPlatformChargeMessages(
  row: Awaited<ReturnType<PlatformBillingAutomationService['ensureRow']>>,
): ChargeMessageSettingsDto {
  return {
    templates: parseChargeMessageTemplates(
      row.chargeMessageTemplates,
      DEFAULT_PLATFORM_SAAS_CHARGE_MESSAGE_TEMPLATES,
    ),
    delayMs: row.chargeMessageDelayMs ?? DEFAULT_CHARGE_MESSAGE_DELAY_MS,
  };
}

function mapPlatformAutomation(
  row: Awaited<ReturnType<PlatformBillingAutomationService['ensureRow']>>,
): PlatformBillingAutomationSettingsDto {
  const summary = parsePlatformLastRunSummary(row.lastAutomationRunSummary);
  return {
    active: row.active,
    sendWhatsapp: true,
    sendPaymentCharge: true,
    automationRunHour: row.automationRunHour,
    automationRunMinute: row.automationRunMinute,
    suspendOverdueAccounts: row.suspendOverdueAccounts,
    lastRun: {
      runAt: row.lastAutomationRunAt?.toISOString() ?? null,
      ...summary,
    },
  };
}

function parsePlatformLastRunSummary(value: unknown) {
  if (!value || typeof value !== 'object') {
    return {
      invoicesCreated: 0,
      chargesSent: 0,
      chargesFailed: 0,
      accountsSuspended: 0,
      errorsCount: 0,
      errors: [] as string[],
    };
  }
  const record = value as Record<string, unknown>;
  const errors = Array.isArray(record.errors)
    ? record.errors.filter((item): item is string => typeof item === 'string')
    : [];
  return {
    invoicesCreated: Number(record.invoicesCreated ?? 0),
    chargesSent: Number(record.chargesSent ?? 0),
    chargesFailed: Number(record.chargesFailed ?? 0),
    accountsSuspended: Number(record.accountsSuspended ?? 0),
    errorsCount: Number(record.errorsCount ?? errors.length),
    errors,
  };
}
