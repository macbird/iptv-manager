import { prisma } from '../../core/database';
import {
  ApiValidationError,
  buildCustomerConfigurationWarning,
  CustomerInput,
  ENTITY_INACTIVE_STATUS,
} from '@client-manager/shared';
import {
  assertCustomerSelectable,
  assertSelectablePlan,
  assertSelectableServers,
} from '../../core/validators/selectable-entities';
import { customerOrderBy } from '../../core/utils/list-order-by';

/**
 * Builds a single expiresAt filter; first matching filter wins to avoid conflicting spreads.
 */
export function buildExpiresAtFilter(listFilters: Record<string, string>) {
  const now = new Date();

  if (listFilters.expiredOnly === 'true') {
    return { expiresAt: { lt: now } };
  }
  if (listFilters.upcomingOnly === 'true') {
    return { expiresAt: { gte: now } };
  }
  if (listFilters.expiringWithinDays) {
    const days = parseInt(listFilters.expiringWithinDays, 10);
    const end = new Date();
    if (Number.isFinite(days) && days >= 0) {
      end.setDate(end.getDate() + days);
    }
    return { expiresAt: { gte: now, lte: end } };
  }
  if (listFilters.expiresFrom || listFilters.expiresTo) {
    return {
      expiresAt: {
        ...(listFilters.expiresFrom
          ? { gte: new Date(`${listFilters.expiresFrom}T00:00:00.000Z`) }
          : {}),
        ...(listFilters.expiresTo
          ? { lte: new Date(`${listFilters.expiresTo}T23:59:59.999Z`) }
          : {}),
      },
    };
  }
  return {};
}

type PrismaLike = {
  customer: {
    findMany: typeof prisma.customer.findMany;
    count: typeof prisma.customer.count;
    findFirst: typeof prisma.customer.findFirst;
    findFirstOrThrow: typeof prisma.customer.findFirstOrThrow;
    create: typeof prisma.customer.create;
    update: typeof prisma.customer.update;
  };
};

export class CustomersService {
  constructor(private readonly db: PrismaLike = prisma) {}

  async list(
    tenantId: string,
    page: number,
    pageSize: number,
    filter: string,
    listFilters: Record<string, string> = {},
    selectableOnly = false,
  ) {
    const skip = (page - 1) * pageSize;
    const trimmed = filter.trim();

    const where = {
      tenantId,
      ...(selectableOnly ? { status: { not: ENTITY_INACTIVE_STATUS } } : {}),
      ...(trimmed
        ? {
            OR: [
              { name: { contains: trimmed, mode: 'insensitive' as const } },
              { phone: { contains: trimmed, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(listFilters.status ? { status: listFilters.status as never } : {}),
      ...(listFilters.planId ? { planId: listFilters.planId } : {}),
      ...buildExpiresAtFilter(listFilters),
    };

    const [rows, total] = await Promise.all([
      this.db.customer.findMany({
        where,
        orderBy: customerOrderBy(listFilters.sortBy),
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          status: true,
          expiresAt: true,
          plan: { select: { id: true, name: true, price: true, status: true } },
          tags: { select: { id: true, name: true, color: true } },
          connections: { select: { server: { select: { status: true } } } },
          _count: { select: { connections: true } },
        },
      }),
      this.db.customer.count({ where }),
    ]);

    const data = rows.map(({ _count, expiresAt, plan, connections, ...row }) => ({
      ...row,
      expiresAt: expiresAt?.toISOString() ?? null,
      plan: plan
        ? {
            id: plan.id,
            name: plan.name,
            price: Number(plan.price),
            status: plan.status,
          }
        : null,
      connectionCount: _count.connections,
      configurationWarning: buildCustomerConfigurationWarning({
        planStatus: plan?.status,
        serverStatuses: connections.map((connection) => connection.server.status),
      }),
    }));

    return { data, total };
  }

  async findById(tenantId: string, id: string) {
    return await this.db.customer.findFirst({
      where: { id, tenantId },
      include: {
        plan: true,
        tags: true,
        connections: {
          include: {
            server: true,
          },
        },
      },
    });
  }

  async create(tenantId: string, input: CustomerInput & { tagIds?: string[] }) {
    const { connections, planId, tagIds, email, notes, ...customerData } = input;

    if (!connections?.length) {
      throw new ApiValidationError('Adicione ao menos uma conexão');
    }

    await assertSelectablePlan(tenantId, planId);
    await assertSelectableServers(
      tenantId,
      connections.map((connection) => connection.serverId),
    );

    return await this.db.customer.create({
      data: {
        ...customerData,
        email: email || null,
        notes: notes || null,
        tenantId,
        planId: planId || null,
        connections: { create: connections },
        tags: tagIds?.length ? { connect: tagIds.map((id) => ({ id })) } : undefined,
      },
      include: {
        plan: true,
        connections: { include: { server: true } },
        tags: true,
      },
    });
  }

  async update(tenantId: string, id: string, input: CustomerInput & { tagIds?: string[] }) {
    const { connections, tagIds, email, notes, ...customerData } = input;

    if (!connections?.length) {
      throw new ApiValidationError('Adicione ao menos uma conexão');
    }

    await this.db.customer.findFirstOrThrow({
      where: { id, tenantId },
    });

    await assertSelectablePlan(tenantId, customerData.planId);
    await assertSelectableServers(
      tenantId,
      connections.map((connection) => connection.serverId),
    );

    return await prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id },
        data: {
          ...customerData,
          email: email || null,
          notes: notes || null,
          tags: tagIds
            ? { set: tagIds.map((tagId) => ({ id: tagId })) }
            : undefined,
        },
      });

      await tx.connection.deleteMany({ where: { customerId: id } });
      await tx.connection.createMany({
        data: connections.map((c) => ({ ...c, customerId: id })),
      });

      return await tx.customer.findUniqueOrThrow({
        where: { id },
        include: {
          plan: true,
          connections: { include: { server: true } },
          tags: true,
        },
      });
    });
  }

  async deactivate(tenantId: string, id: string) {
    await this.db.customer.findFirstOrThrow({
      where: { id, tenantId },
    });

    return await this.db.customer.update({
      where: { id },
      data: { status: ENTITY_INACTIVE_STATUS },
    });
  }

  async activate(tenantId: string, id: string) {
    await this.db.customer.findFirstOrThrow({
      where: { id, tenantId },
    });

    return await this.db.customer.update({
      where: { id },
      data: { status: 'active' },
    });
  }
}
