import { prisma } from '../../core/database';
import { CustomerInput } from '@client-manager/shared';

export class CustomersService {
  async list(tenantId: string | undefined, page: number, pageSize: number, filter: string) {
    const skip = (page - 1) * pageSize;
    const where: any = {
      name: { contains: filter, mode: 'insensitive' as const },
    };
    
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          plan: true,
          tags: true,
          connections: {
            include: { server: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return { data, total };
  }

  async findById(tenantId: string | undefined, id: string) {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;
    return await prisma.customer.findFirst({
      where,
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

  async create(tenantId: string | undefined, input: any) {
    const { connections, planId, tagIds, ...customerData } = input;
    
    const data: any = {
      ...customerData,
      connections: connections ? {
        create: connections
      } : undefined,
      tags: tagIds ? {
        connect: tagIds.map((id: string) => ({ id }))
      } : undefined,
    };

    if (planId) {
      data.plan = {
        connect: { id: planId }
      };
    }

    if (tenantId) {
      data.account = {
        connect: { id: tenantId }
      };
    }

    return await prisma.customer.create({
      data,
      include: {
        plan: true,
        connections: {
          include: {
            server: true,
          },
        },
        tags: true,
      },
    });
  }

  async update(tenantId: string | undefined, id: string, input: any) {
    const { connections, tagIds, ...customerData } = input;
    
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;

    await prisma.customer.findFirstOrThrow({
      where,
    });

    return await prisma.$transaction(async (tx) => {
      // Update basic customer data
      const customer = await tx.customer.update({
        where: { id },
        data: {
          ...customerData,
          tags: tagIds ? {
            set: tagIds.map((tagId: string) => ({ id: tagId }))
          } : undefined,
        },
      });

      // Handle connections update
      if (connections) {
        await tx.connection.deleteMany({ where: { customerId: id } });
        await tx.connection.createMany({
          data: connections.map((c: any) => ({ ...c, customerId: id })),
        });
      }

      return await tx.customer.findUniqueOrThrow({
        where: { id },
        include: {
          plan: true,
          connections: {
            include: {
              server: true,
            },
          },
          tags: true,
        },
      });
    });
  }

  async delete(tenantId: string | undefined, id: string) {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;

    await prisma.customer.findFirstOrThrow({
      where,
    });

    return await prisma.customer.delete({
      where: { id },
    });
  }
}
