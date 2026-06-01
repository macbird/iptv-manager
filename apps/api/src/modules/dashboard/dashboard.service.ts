import { prisma } from '../../core/database';

export class DashboardService {
  async getStats(tenantId: string) {
    const now = new Date();
    const inSevenDays = new Date(now);
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    const [
      totalCustomers,
      activeCustomers,
      totalPlans,
      totalServers,
      totalConnections,
      expiringSoon,
      expired,
      customersWithPlans,
    ] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.customer.count({ where: { tenantId, status: 'active' } }),
      prisma.plan.count({ where: { tenantId } }),
      prisma.server.count({ where: { tenantId } }),
      prisma.connection.count({ where: { customer: { tenantId } } }),
      prisma.customer.count({
        where: {
          tenantId,
          expiresAt: { gte: now, lte: inSevenDays },
        },
      }),
      prisma.customer.count({
        where: {
          tenantId,
          expiresAt: { lt: now },
        },
      }),
      prisma.customer.findMany({
        where: { tenantId, status: 'active', planId: { not: null } },
        include: { plan: { select: { price: true } } },
      }),
    ]);

    const estimatedMrr = customersWithPlans.reduce(
      (sum, customer) => sum + Number(customer.plan?.price ?? 0),
      0,
    );

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers: totalCustomers - activeCustomers,
      totalPlans,
      totalServers,
      totalConnections,
      expiringSoon,
      expired,
      estimatedMrr,
    };
  }

  async getUpcomingExpirations(tenantId: string, limit = 5) {
    const now = new Date();

    return await prisma.customer.findMany({
      where: {
        tenantId,
        expiresAt: { gte: now },
      },
      orderBy: { expiresAt: 'asc' },
      take: limit,
      select: {
        id: true,
        name: true,
        expiresAt: true,
        status: true,
        plan: { select: { name: true } },
      },
    });
  }
}
