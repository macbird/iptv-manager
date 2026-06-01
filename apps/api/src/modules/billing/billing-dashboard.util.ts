import { prisma } from '../../core/database';
import type { BillingScope } from '@prisma/client';

export interface MonthlyBillingPoint {
  month: string;
  label: string;
  issuedCents: number;
  receivedCents: number;
  invoiceCount: number;
  paidCount: number;
}

function cycleKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function lastMonths(count: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(cycleKey(d.getFullYear(), d.getMonth()));
  }
  return keys;
}

export function monthLabelPt(key: string) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

export async function getMonthlyBillingTrend(
  scope: BillingScope,
  accountId?: string,
  monthsCount = 6,
): Promise<MonthlyBillingPoint[]> {
  const months = lastMonths(monthsCount);
  const whereBase = {
    scope,
    ...(accountId ? { accountId } : {}),
    billingCycleKey: { in: months },
  };

  const invoices = await prisma.invoice.findMany({
    where: whereBase,
    select: {
      billingCycleKey: true,
      amountCents: true,
      status: true,
    },
  });

  const payments = await prisma.payment.findMany({
    where: {
      invoice: whereBase,
    },
    select: {
      amountCents: true,
      invoice: { select: { billingCycleKey: true } },
    },
  });

  return months.map((month) => {
    const monthInvoices = invoices.filter((i) => i.billingCycleKey === month);
    const issuedCents = monthInvoices.reduce((s, i) => s + i.amountCents, 0);
    const paidCount = monthInvoices.filter((i) => i.status === 'paid').length;
    const receivedCents = payments
      .filter((p) => p.invoice.billingCycleKey === month)
      .reduce((s, p) => s + p.amountCents, 0);

    return {
      month,
      label: monthLabelPt(month),
      issuedCents,
      receivedCents,
      invoiceCount: monthInvoices.length,
      paidCount,
    };
  });
}

export async function getBillingSnapshot(scope: BillingScope, accountId?: string) {
  const now = new Date();
  const currentCycle = cycleKey(now.getFullYear(), now.getMonth());

  const where = {
    scope,
    ...(accountId ? { accountId } : {}),
  };

  const [open, overdue, paidCycle, openAmountAgg, receivedMonthAgg] = await Promise.all([
    prisma.invoice.count({ where: { ...where, status: 'open' } }),
    prisma.invoice.count({ where: { ...where, status: 'overdue' } }),
    prisma.invoice.count({
      where: { ...where, billingCycleKey: currentCycle, status: 'paid' },
    }),
    prisma.invoice.aggregate({
      where: { ...where, status: { in: ['open', 'overdue'] } },
      _sum: { amountCents: true },
    }),
    prisma.payment.aggregate({
      where: {
        invoice: { ...where, billingCycleKey: currentCycle },
      },
      _sum: { amountCents: true },
    }),
  ]);

  const issuedCurrent = await prisma.invoice.aggregate({
    where: { ...where, billingCycleKey: currentCycle },
    _sum: { amountCents: true },
    _count: true,
  });

  const issuedCents = issuedCurrent._sum.amountCents ?? 0;
  const issuedCount = issuedCurrent._count;
  const collectionRate =
    issuedCount > 0 ? Math.round((paidCycle / issuedCount) * 100) : 0;

  return {
    openInvoices: open,
    overdueInvoices: overdue,
    paidInCurrentCycle: paidCycle,
    openAmountCents: openAmountAgg._sum.amountCents ?? 0,
    receivedCurrentMonthCents: receivedMonthAgg._sum.amountCents ?? 0,
    issuedCurrentMonthCents: issuedCents,
    collectionRate,
  };
}
