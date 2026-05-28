import { prisma } from '../../core/database';
import { CustomerInput } from '@iptv-manager/shared';

export class CustomersService {
  async list(tenantId: string) {
    return await prisma.customer.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        plan: true,
        server: true,
      },
    });
  }

  async findById(tenantId: string, id: string) {
    return await prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        plan: true,
        server: true,
      },
    });
  }

  async create(tenantId: string, input: any) {
    return await prisma.customer.create({
      data: {
        ...input,
        tenantId,
      },
      include: {
        plan: true,
        server: true,
      },
    });
  }

  async update(tenantId: string, id: string, input: any) {
    await prisma.customer.findFirstOrThrow({
      where: { id, tenantId },
    });

    return await prisma.customer.update({
      where: { id },
      data: input,
      include: {
        plan: true,
        server: true,
      },
    });
  }

  async delete(tenantId: string, id: string) {
    await prisma.customer.findFirstOrThrow({
      where: { id, tenantId },
    });

    return await prisma.customer.delete({
      where: { id },
    });
  }
}
