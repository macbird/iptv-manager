import { prisma } from '../../core/database';
import type { BillingScope } from '@prisma/client';

/**
 * Returns UTC midnight for the calendar day of the given instant.
 */
export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * True when the invoice due calendar day is before today (UTC).
 */
export function isInvoicePastDue(dueDate: Date, reference = new Date()): boolean {
  return startOfUtcDay(dueDate) < startOfUtcDay(reference);
}

/**
 * Promotes open invoices whose due date has passed to overdue status.
 */
export async function syncOverdueInvoices(
  scope: BillingScope,
  accountId?: string,
): Promise<number> {
  const startOfToday = startOfUtcDay(new Date());

  const result = await prisma.invoice.updateMany({
    where: {
      scope,
      ...(accountId ? { accountId } : {}),
      status: 'open',
      dueDate: { lt: startOfToday },
    },
    data: { status: 'overdue' },
  });

  return result.count;
}
