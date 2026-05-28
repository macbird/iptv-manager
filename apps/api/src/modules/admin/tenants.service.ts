import { prisma } from '../../core/database';
import argon2 from 'argon2';
import slugify from 'slugify';

export class TenantsService {
  async list() {
    return await prisma.account.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            passwordResetRequired: true
          }
        },
        _count: {
          select: { users: true },
        },
      },
    });
  }

  async create(input: { name: string, slug?: string, ownerEmail: string, ownerName: string, initialPassword?: string }) {
    const slug = input.slug || slugify(input.name, { lower: true });
    const initialPassword = input.initialPassword || 'Mudar123!';
    const passwordHash = await argon2.hash(initialPassword);

    return await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          name: input.name,
          slug,
          status: 'active',
        },
      });

      await tx.accountUser.create({
        data: {
          accountId: account.id,
          email: input.ownerEmail,
          name: input.ownerName,
          passwordHash,
          role: 'tenant_owner',
          passwordResetRequired: true,
        },
      });

      return account;
    });
  }

  async toggleStatus(id: string, status: 'active' | 'suspended') {
    return await prisma.account.update({
      where: { id },
      data: {
        status: status === 'active' ? 'active' : 'suspended',
      },
    });
  }

  async resetPassword(userId: string, newPassword?: string) {
    const password = newPassword || 'Reset123!';
    const passwordHash = await argon2.hash(password);

    return await prisma.accountUser.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordResetRequired: true,
      },
    });
  }
}
