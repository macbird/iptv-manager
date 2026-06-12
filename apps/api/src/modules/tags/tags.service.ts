import { prisma } from '../../core/database';
import { ApiValidationError, TagInput } from '@client-manager/shared';

export type TagScope = 'customer' | 'server';

export class TagsService {
  async list(
    tenantId: string,
    page: number,
    pageSize: number,
    filter: string,
    scope?: TagScope,
  ) {
    const skip = (page - 1) * pageSize;
    const where: Record<string, unknown> = {
      tenantId,
      ...(filter
        ? { name: { contains: filter, mode: 'insensitive' as const } }
        : {}),
    };

    if (scope === 'customer') {
      where.customers = { some: {} };
    } else if (scope === 'server') {
      where.servers = { some: {} };
    }

    const [data, total] = await Promise.all([
      prisma.tag.findMany({
        where: where as never,
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
      }),
      prisma.tag.count({ where: where as never }),
    ]);

    return { data, total };
  }

  async search(tenantId: string, filter: string) {
    return this.list(tenantId, 1, 20, filter).then((res) => res.data);
  }

  async findOrCreate(tenantId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new ApiValidationError('Nome da tag é obrigatório');
    }

    const existing = await prisma.tag.findFirst({
      where: {
        tenantId,
        name: { equals: trimmed, mode: 'insensitive' },
      },
    });

    if (existing) {
      return existing;
    }

    return await prisma.tag.create({
      data: {
        name: trimmed,
        account: { connect: { id: tenantId } },
      },
    });
  }

  async create(tenantId: string, input: TagInput) {
    return await this.findOrCreate(tenantId, input.name);
  }

  async update(tenantId: string, id: string, input: TagInput) {
    await prisma.tag.findFirstOrThrow({
      where: { id, tenantId },
    });

    return await prisma.tag.update({
      where: { id },
      data: input,
    });
  }

  async delete(tenantId: string, id: string) {
    await prisma.tag.findFirstOrThrow({
      where: { id, tenantId },
    });

    return await prisma.tag.delete({
      where: { id },
    });
  }
}
