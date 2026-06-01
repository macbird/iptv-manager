import { prisma } from '../../core/database';
import { CustomerInput } from '@client-manager/shared';
type PrismaLike = {
  customer: {
    findMany: typeof prisma.customer.findMany;
    count: typeof prisma.customer.count;
    findFirst: typeof prisma.customer.findFirst;
    findFirstOrThrow: typeof prisma.customer.findFirstOrThrow;
    create: typeof prisma.customer.create;
    delete: typeof prisma.customer.delete;
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
  ) {
    const skip = (page - 1) * pageSize;
    const trimmed = filter.trim();

    const where = {
      tenantId,
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
      ...(listFilters.expiresFrom || listFilters.expiresTo
        ? {
            expiresAt: {
              ...(listFilters.expiresFrom
                ? { gte: new Date(`${listFilters.expiresFrom}T00:00:00.000Z`) }
                : {}),
              ...(listFilters.expiresTo
                ? { lte: new Date(`${listFilters.expiresTo}T23:59:59.999Z`) }
                : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.db.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          status: true,
          expiresAt: true,
          plan: { select: { id: true, name: true } },
          tags: { select: { id: true, name: true, color: true } },
          _count: { select: { connections: true } },
        },
      }),
      this.db.customer.count({ where }),
    ]);

    const data = rows.map(({ _count, expiresAt, ...row }) => ({
      ...row,
      expiresAt: expiresAt?.toISOString() ?? null,
      connectionCount: _count.connections,
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

    return await this.db.customer.create({
      data: {
        ...customerData,
        email: email || null,
        notes: notes || null,
        tenantId,
        planId: planId || null,
        connections: connections?.length ? { create: connections } : undefined,
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

    await this.db.customer.findFirstOrThrow({
      where: { id, tenantId },
    });

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

      if (connections) {
        await tx.connection.deleteMany({ where: { customerId: id } });
        await tx.connection.createMany({
          data: connections.map((c) => ({ ...c, customerId: id })),
        });
      }

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

  async delete(tenantId: string, id: string) {
    await this.db.customer.findFirstOrThrow({
      where: { id, tenantId },
    });

    return await prisma.$transaction(async (tx) => {
      await tx.connection.deleteMany({ where: { customerId: id } });
      return await tx.customer.delete({ where: { id } });
    });
  }
}
