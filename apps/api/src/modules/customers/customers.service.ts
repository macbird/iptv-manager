import { prisma } from '../../core/database';
import { CustomerInput } from '@iptv-manager/shared';

export class CustomersService {
  async list(tenantId: string) {
    return await prisma.customer.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, input: CustomerInput) {
    return await prisma.customer.create({
      data: {
        ...input,
        tenantId,
      },
    });
  }

  async update(tenantId: string, id: string, input: CustomerInput) {
    await prisma.customer.findFirstOrThrow({
      where: { id, tenantId },
    });

    return await prisma.customer.update({
      where: { id },
      data: input,
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
