import { prisma } from '../../core/database';
import { PlanInput } from '@client-manager/shared';

export class PlansService {
  async list(
    tenantId: string,
    page: number,
    pageSize: number,
    filter: string,
    listFilters: Record<string, string> = {},
  ) {
    const skip = (page - 1) * pageSize;
    const trimmed = filter.trim();
    const minPrice = listFilters.minPrice ? Number.parseFloat(listFilters.minPrice) : undefined;
    const maxPrice = listFilters.maxPrice ? Number.parseFloat(listFilters.maxPrice) : undefined;

    const where = {
      tenantId,
      ...(trimmed ? { name: { contains: trimmed, mode: 'insensitive' as const } } : {}),
      ...(listFilters.status ? { status: listFilters.status as never } : {}),
      ...(listFilters.billingCycle ? { billingCycle: listFilters.billingCycle as never } : {}),
      ...(minPrice !== undefined && !Number.isNaN(minPrice) && maxPrice !== undefined && !Number.isNaN(maxPrice)
        ? { price: { gte: minPrice, lte: maxPrice } }
        : minPrice !== undefined && !Number.isNaN(minPrice)
          ? { price: { gte: minPrice } }
          : maxPrice !== undefined && !Number.isNaN(maxPrice)
            ? { price: { lte: maxPrice } }
            : {}),
    };

    const [data, total] = await Promise.all([
      prisma.plan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.plan.count({ where }),
    ]);

    return { data, total };
  }

  async findById(tenantId: string, id: string) {
    return await prisma.plan.findFirst({
      where: { id, tenantId },
    });
  }

  async create(tenantId: string, input: PlanInput) {
    return await prisma.plan.create({
      data: {
        ...input,
        tenantId,
      },
    });
  }

  async update(tenantId: string, id: string, input: PlanInput) {
    console.log('DEBUG: Updating plan:', id, input);
    // Ensure it belongs to the tenant
    await prisma.plan.findFirstOrThrow({
      where: { id, tenantId },
    });

    return await prisma.plan.update({
      where: { id },
      data: input,
    });
  }

  async delete(tenantId: string, id: string) {
    await prisma.plan.findFirstOrThrow({
      where: { id, tenantId },
    });

    return await prisma.plan.delete({
      where: { id },
    });
  }
}
