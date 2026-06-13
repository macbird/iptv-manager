import {
  calendarDaysSinceDue,
  DEFAULT_BILLING_TIMEZONE,
  getDueDateBoundsForOverdueWindow,
  isOverdueWindowEligible,
  resolveOverdueReminderWindowDays,
  type OverdueReminderRunSummary,
} from '@client-manager/shared';
import { prisma } from '../../core/database';
import { InvoiceChargeService } from './invoice-charge.service';

const defaultInvoiceChargeService = new InvoiceChargeService();

export interface OverdueReminderTenantRunResult extends OverdueReminderRunSummary {
  errors: string[];
}

export interface OverdueReminderServiceDeps {
  prisma?: typeof prisma;
  invoiceChargeService?: InvoiceChargeService;
}

/**
 * Processes post-due overdue reminder windows (D+N) for subscription invoices.
 *
 * @author João Paulo da Silva
 * @since 4.9.0
 * @creationDate 12/06/2026

 */
export class OverdueReminderService {
  private readonly db: typeof prisma;
  private readonly invoiceChargeService: InvoiceChargeService;

  constructor(deps: OverdueReminderServiceDeps = {}) {
    this.db = deps.prisma ?? prisma;
    this.invoiceChargeService = deps.invoiceChargeService ?? defaultInvoiceChargeService;
  }

  /**
   * Sends overdue reminders for all configured windows on eligible tenant invoices.
   */
  async runForTenant(
    accountId: string,
    options?: { timeZone?: string; referenceDate?: Date },
  ): Promise<OverdueReminderTenantRunResult> {
    const timeZone = options?.timeZone ?? DEFAULT_BILLING_TIMEZONE;
    const referenceDate = options?.referenceDate ?? new Date();

    const result: OverdueReminderTenantRunResult = {
      sent: [],
      failed: [],
      skippedBlocked: 0,
      skippedNoPix: 0,
      errors: [],
    };

    const config = await this.db.tenantBillingAutomationConfig.findUnique({
      where: { accountId },
    });

    if (!config?.active || !config.overdueRemindersEnabled || !config.sendWhatsapp) {
      return result;
    }

    const windows = resolveOverdueReminderWindowDays(
      config.overdueMessageTemplates,
      config.overdueReminderDays,
    );
    if (windows.length === 0) {
      return result;
    }

    for (const windowDaysAfterDue of windows) {
      await this.processWindow(accountId, windowDaysAfterDue, config.overdueReminderFailureGraceDays, {
        timeZone,
        referenceDate,
        result,
      });
    }

    return result;
  }

  private async processWindow(
    accountId: string,
    windowDaysAfterDue: number,
    failureGraceDays: number,
    ctx: {
      timeZone: string;
      referenceDate: Date;
      result: OverdueReminderTenantRunResult;
    },
  ): Promise<void> {
    const dueDateBounds = getDueDateBoundsForOverdueWindow({
      referenceDate: ctx.referenceDate,
      windowDaysAfterDue,
      failureGraceDays,
      timeZone: ctx.timeZone,
    });

    const invoices = await this.db.invoice.findMany({
      where: {
        scope: 'tenant',
        accountId,
        kind: 'subscription',
        status: { in: ['open', 'overdue'] },
        dueDate: { gte: dueDateBounds.gte, lte: dueDateBounds.lte },
        customer: { isNot: null },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, status: true } },
        chargeDeliveries: {
          where: {
            source: 'automation_overdue',
            windowDaysAfterDue,
            success: true,
          },
          take: 1,
        },
      },
    });

    for (const invoice of invoices) {
      if (invoice.chargeDeliveries.length > 0) {
        continue;
      }

      if (!invoice.customer) {
        continue;
      }

      if (invoice.customer.status !== 'active') {
        ctx.result.skippedBlocked += 1;
        continue;
      }

      if (!isOverdueWindowEligible({
        dueDate: invoice.dueDate,
        windowDaysAfterDue,
        failureGraceDays,
        referenceDate: ctx.referenceDate,
        timeZone: ctx.timeZone,
      })) {
        continue;
      }

      if (!invoice.pixCopyPaste?.trim()) {
        ctx.result.skippedNoPix += 1;
        continue;
      }

      const customerName = invoice.customer.name;
      const daysOverdue = calendarDaysSinceDue(
        invoice.dueDate,
        ctx.referenceDate,
        ctx.timeZone,
      );

      try {
        const delivery = await this.invoiceChargeService.sendOverdueReminderViaWhatsApp(
          invoice.id,
          accountId,
          windowDaysAfterDue,
          daysOverdue,
        );

        ctx.result.sent.push({
          customerName,
          phoneMasked: delivery.phoneMasked ?? '****',
          windowDaysAfterDue,
          amountCents: invoice.amountCents,
          dueDate: invoice.dueDate,
          messagesCount: delivery.messagesCount,
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        ctx.result.failed.push({
          customerName,
          windowDaysAfterDue,
          reason,
        });
        ctx.result.errors.push(
          `overdue D+${windowDaysAfterDue} invoice ${invoice.id}: ${reason}`,
        );
      }
    }
  }
}
