import { prisma } from '../../core/database';
import {
  getBillingSnapshot,
  getMonthlyBillingTrend,
} from '../billing/billing-dashboard.util';

export class AdminDashboardService {
  async getStats() {
    const [totalAccounts, activeAccounts, totalUsers, billing, monthlyBilling, recentPayments] =
      await Promise.all([
        prisma.account.count(),
        prisma.account.count({ where: { status: 'active' } }),
        prisma.accountUser.count(),
        getBillingSnapshot('platform'),
        getMonthlyBillingTrend('platform'),
        this.getRecentPayments(5),
      ]);

    const activeSubscriptions = await prisma.accountSubscription.count({
      where: { status: 'active' },
    });
    const defaultPlan = await prisma.platformPlan.findFirst({ where: { isDefault: true } });
    const expectedMrrCents = (defaultPlan?.priceCents ?? 0) * activeSubscriptions;

    return {
      totalAccounts,
      activeAccounts,
      suspendedAccounts: totalAccounts - activeAccounts,
      totalUsers,
      expectedMrrCents,
      activeSubscriptions,
      billing,
      monthlyBilling,
      recentPayments,
    };
  }

  async getRecentPayments(limit = 5) {
    const rows = await prisma.payment.findMany({
      where: { invoice: { scope: 'platform' } },
      orderBy: { paidAt: 'desc' },
      take: limit,
      include: {
        invoice: {
          select: {
            billingCycleKey: true,
            account: { select: { name: true } },
          },
        },
      },
    });

    return rows.map((p) => ({
      id: p.id,
      amountCents: p.amountCents,
      method: p.method,
      paidAt: p.paidAt.toISOString(),
      accountName: p.invoice.account.name,
      billingCycleKey: p.invoice.billingCycleKey,
    }));
  }
}
