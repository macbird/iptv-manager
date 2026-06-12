import { describe, expect, it, vi, beforeEach } from 'vitest';
import { OverdueReminderService } from './overdue-reminder.service';
import { InvoiceChargeService } from './invoice-charge.service';

/**
 * Unit tests for post-due overdue reminder automation (D+N).
 *
 * @author João Paulo da Silva
 * @since 4.9.0
 */
describe('OverdueReminderService', () => {
  const findUnique = vi.fn();
  const findMany = vi.fn();
  const sendOverdueReminderViaWhatsApp = vi.fn();

  const service = new OverdueReminderService({
    prisma: {
      tenantBillingAutomationConfig: { findUnique },
      invoice: { findMany },
    } as never,
    invoiceChargeService: {
      sendOverdueReminderViaWhatsApp,
    } as unknown as InvoiceChargeService,
  });

  const referenceDate = new Date('2026-06-12T12:00:00.000Z');
  const dueDate = new Date('2026-06-05T12:00:00.000Z');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('testRunForTenant_whenAutomationDisabled_shouldReturnEmptySummary', async () => {
    findUnique.mockResolvedValue({
      active: false,
      overdueRemindersEnabled: true,
      sendWhatsapp: true,
      overdueMessageTemplates: { windows: [{ daysAfterDue: 7, templates: ['Hi'] }] },
      overdueReminderDays: [7],
      overdueReminderFailureGraceDays: 1,
    });

    const result = await service.runForTenant('tenant-1', { referenceDate });

    expect(result.sent).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('testRunForTenant_whenWindowsFromTemplates_shouldUseTemplateDays', async () => {
    findUnique.mockResolvedValue({
      active: true,
      overdueRemindersEnabled: true,
      sendWhatsapp: true,
      overdueMessageTemplates: {
        windows: [
          { daysAfterDue: 7, templates: ['D+7'] },
          { daysAfterDue: 20, templates: ['D+20'] },
        ],
      },
      overdueReminderDays: [1, 15],
      overdueReminderFailureGraceDays: 1,
    });
    findMany.mockResolvedValue([]);

    await service.runForTenant('tenant-1', { referenceDate });

    expect(findMany).toHaveBeenCalledTimes(2);
    expect(
      findMany.mock.calls[0][0].include.chargeDeliveries.where.windowDaysAfterDue,
    ).toBe(7);
    expect(
      findMany.mock.calls[1][0].include.chargeDeliveries.where.windowDaysAfterDue,
    ).toBe(20);
  });

  it('testRunForTenant_whenEligibleInvoice_shouldSendReminder', async () => {
    findUnique.mockResolvedValue({
      active: true,
      overdueRemindersEnabled: true,
      sendWhatsapp: true,
      overdueMessageTemplates: { windows: [{ daysAfterDue: 7, templates: ['Hi'] }] },
      overdueReminderDays: [7],
      overdueReminderFailureGraceDays: 1,
    });
    findMany.mockResolvedValue([
      {
        id: 'inv-1',
        dueDate,
        amountCents: 4990,
        pixCopyPaste: '000201PIX',
        customer: { id: 'c1', name: 'Maria Silva', phone: '5511999999999', status: 'active' },
        chargeDeliveries: [],
      },
    ]);
    sendOverdueReminderViaWhatsApp.mockResolvedValue({
      phoneMasked: '5511****99',
      messagesCount: 2,
    });

    const result = await service.runForTenant('tenant-1', { referenceDate });

    expect(sendOverdueReminderViaWhatsApp).toHaveBeenCalledWith('inv-1', 'tenant-1', 7, 7);
    expect(result.sent).toHaveLength(1);
    expect(result.sent[0].customerName).toBe('Maria Silva');
  });

  it('testRunForTenant_whenAlreadySentForWindow_shouldSkip', async () => {
    findUnique.mockResolvedValue({
      active: true,
      overdueRemindersEnabled: true,
      sendWhatsapp: true,
      overdueMessageTemplates: { windows: [{ daysAfterDue: 7, templates: ['Hi'] }] },
      overdueReminderDays: [7],
      overdueReminderFailureGraceDays: 1,
    });
    findMany.mockResolvedValue([
      {
        id: 'inv-1',
        dueDate,
        amountCents: 4990,
        pixCopyPaste: '000201PIX',
        customer: { id: 'c1', name: 'Maria Silva', phone: '5511999999999', status: 'active' },
        chargeDeliveries: [{ id: 'delivery-1' }],
      },
    ]);

    const result = await service.runForTenant('tenant-1', { referenceDate });

    expect(sendOverdueReminderViaWhatsApp).not.toHaveBeenCalled();
    expect(result.sent).toEqual([]);
  });

  it('testRunForTenant_whenNoPix_shouldIncrementSkippedNoPix', async () => {
    findUnique.mockResolvedValue({
      active: true,
      overdueRemindersEnabled: true,
      sendWhatsapp: true,
      overdueMessageTemplates: { windows: [{ daysAfterDue: 7, templates: ['Hi'] }] },
      overdueReminderDays: [7],
      overdueReminderFailureGraceDays: 1,
    });
    findMany.mockResolvedValue([
      {
        id: 'inv-1',
        dueDate,
        amountCents: 4990,
        pixCopyPaste: null,
        customer: { id: 'c1', name: 'Maria Silva', phone: '5511999999999', status: 'active' },
        chargeDeliveries: [],
      },
    ]);

    const result = await service.runForTenant('tenant-1', { referenceDate });

    expect(result.skippedNoPix).toBe(1);
    expect(sendOverdueReminderViaWhatsApp).not.toHaveBeenCalled();
  });

  it('testRunForTenant_whenCustomerBlocked_shouldIncrementSkippedBlocked', async () => {
    findUnique.mockResolvedValue({
      active: true,
      overdueRemindersEnabled: true,
      sendWhatsapp: true,
      overdueMessageTemplates: { windows: [{ daysAfterDue: 7, templates: ['Hi'] }] },
      overdueReminderDays: [7],
      overdueReminderFailureGraceDays: 1,
    });
    findMany.mockResolvedValue([
      {
        id: 'inv-1',
        dueDate,
        amountCents: 4990,
        pixCopyPaste: '000201PIX',
        customer: { id: 'c1', name: 'João', phone: '5511888888888', status: 'inactive' },
        chargeDeliveries: [],
      },
    ]);

    const result = await service.runForTenant('tenant-1', { referenceDate });

    expect(result.skippedBlocked).toBe(1);
    expect(sendOverdueReminderViaWhatsApp).not.toHaveBeenCalled();
  });
});
