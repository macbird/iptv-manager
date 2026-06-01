import { prisma } from '../../core/database';
import type { BillingScope } from '@prisma/client';

export class PaymentsService {
  async list(
    scope: BillingScope,
    accountId: string | null,
    page: number,
    pageSize: number,
    listFilters: Record<string, string> = {},
  ) {
    const skip = (page - 1) * pageSize;

    const where = {
      ...(listFilters.method ? { method: listFilters.method } : {}),
      ...(listFilters.paidFrom || listFilters.paidTo
        ? {
            paidAt: {
              ...(listFilters.paidFrom
                ? { gte: new Date(`${listFilters.paidFrom}T00:00:00.000Z`) }
                : {}),
              ...(listFilters.paidTo
                ? { lte: new Date(`${listFilters.paidTo}T23:59:59.999Z`) }
                : {}),
            },
          }
        : {}),
      invoice: {
        scope,
        ...(accountId ? { accountId } : {}),
        ...(listFilters.billingCycleKey
          ? { billingCycleKey: listFilters.billingCycleKey }
          : {}),
      },
    };

    const [rows, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { paidAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          invoice: {
            include: {
              account: { select: { name: true } },
              customer: { select: { name: true } },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    const data = rows.map((row) => ({
      id: row.id,
      amountCents: row.amountCents,
      method: row.method,
      paidAt: row.paidAt.toISOString(),
      invoice: {
        id: row.invoice.id,
        billingCycleKey: row.invoice.billingCycleKey,
        scope: row.invoice.scope,
        accountName: row.invoice.account.name,
        customerName: row.invoice.customer?.name ?? null,
      },
    }));

    return { data, total };
  }

  async getById(scope: BillingScope, paymentId: string, accountId: string | null) {
    const row = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        invoice: {
          scope,
          ...(accountId ? { accountId } : {}),
        },
      },
      include: {
        invoice: {
          include: {
            account: { select: { id: true, name: true } },
            customer: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      amountCents: row.amountCents,
      method: row.method,
      paidAt: row.paidAt.toISOString(),
      providerPaymentId: row.providerPaymentId,
      createdAt: row.createdAt.toISOString(),
      invoice: {
        id: row.invoice.id,
        billingCycleKey: row.invoice.billingCycleKey,
        scope: row.invoice.scope,
        amountCents: row.invoice.amountCents,
        dueDate: row.invoice.dueDate.toISOString(),
        status: row.invoice.status,
        pixCopyPaste: row.invoice.pixCopyPaste,
        paidAt: row.invoice.paidAt?.toISOString() ?? null,
        account: row.invoice.account,
        customer: row.invoice.customer,
      },
    };
  }
}
