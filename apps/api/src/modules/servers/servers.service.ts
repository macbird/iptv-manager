import { prisma } from '../../core/database';
import { ServerInput } from '@client-manager/shared';

export class ServersService {
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
              { panelUrl: { contains: trimmed, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(listFilters.status ? { status: listFilters.status as never } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.server.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: { tags: true },
      }),
      prisma.server.count({ where }),
    ]);

    return { data, total };
  }

  async create(tenantId: string, input: any) {
    const { tagIds, ...serverData } = input;
    return await prisma.server.create({
      data: {
        ...serverData,
        tenantId,
        tags: tagIds ? {
          connect: tagIds.map((id: string) => ({ id }))
        } : undefined,
      },
      include: { tags: true }
    });
  }

  async update(tenantId: string, id: string, input: any) {
    const { tagIds, ...serverData } = input;
    await prisma.server.findFirstOrThrow({
      where: { id, tenantId },
    });

    return await prisma.server.update({
      where: { id },
      data: {
        ...serverData,
        tags: tagIds ? {
          set: tagIds.map((id: string) => ({ id }))
        } : undefined,
      },
      include: { tags: true }
    });
  }

  async delete(tenantId: string, id: string) {
    await prisma.server.findFirstOrThrow({
      where: { id, tenantId },
    });

    return await prisma.$transaction(async (tx) => {
      await tx.connection.deleteMany({ where: { serverId: id } });
      return await tx.server.delete({ where: { id } });
    });
  }
}
