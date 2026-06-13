import { BillingCycle, Prisma } from '@prisma/client';
import { API_ERROR_CODES, ApiBusinessError, PlatformPlanInput } from '@client-manager/shared';
import { prisma } from '../../core/database';

type PlatformPlanRow = {
  id: string;
  name: string;
  priceCents: number;
  billingCycle: BillingCycle;
  maxCustomers: number | null;
  active: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: { subscriptions: number };
};

function mapPlatformPlan(plan: PlatformPlanRow) {
  return {
    id: plan.id,
    name: plan.name,
    priceCents: plan.priceCents,
    billingCycle: plan.billingCycle,
    maxCustomers: plan.maxCustomers,
    active: plan.active,
    isDefault: plan.isDefault,
    subscriptionCount: plan._count?.subscriptions ?? 0,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

/**
 * CRUD and lifecycle rules for SaaS {@link PlatformPlan} records.
 *
 * @author João Paulo da Silva
 * @since 4.9.0
 * @creationDate 12/06/2026

 */
export class PlatformPlansService {
  /**
   * Lists platform SaaS plans with optional name filter and active-only mode.
   */
  async list(
    page: number,
    pageSize: number,
    filter: string,
    selectableOnly = false,
  ) {
    const skip = (page - 1) * pageSize;
    const trimmed = filter.trim();
    const where = {
      ...(selectableOnly ? { active: true } : {}),
      ...(trimmed ? { name: { contains: trimmed, mode: 'insensitive' as const } } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.platformPlan.findMany({
        where,
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        skip,
        take: pageSize,
        include: {
          _count: {
            select: {
              subscriptions: {
                where: { status: { in: ['active', 'past_due'] } },
              },
            },
          },
        },
      }),
      prisma.platformPlan.count({ where }),
    ]);

    return { data: rows.map(mapPlatformPlan), total };
  }

  /**
   * Returns a single platform plan by id.
   */
  async findById(id: string) {
    const plan = await prisma.platformPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: { status: { in: ['active', 'past_due'] } },
            },
          },
        },
      },
    });
    return plan ? mapPlatformPlan(plan) : null;
  }

  /**
   * Creates a platform SaaS plan and optionally assigns it as the default plan.
   */
  async create(input: PlatformPlanInput) {
    try {
      return await prisma.$transaction(async (tx) => {
        if (input.isDefault) {
          await tx.platformPlan.updateMany({
            where: { isDefault: true },
            data: { isDefault: false },
          });
        }

        const plan = await tx.platformPlan.create({
          data: {
            name: input.name,
            priceCents: input.priceCents,
            billingCycle: 'monthly',
            maxCustomers: input.maxCustomers ?? null,
            active: input.active,
            isDefault: input.isDefault,
          },
          include: {
            _count: {
              select: {
                subscriptions: {
                  where: { status: { in: ['active', 'past_due'] } },
                },
              },
            },
          },
        });

        if (!input.isDefault) {
          const defaultCount = await tx.platformPlan.count({ where: { isDefault: true } });
          if (defaultCount === 0) {
            await tx.platformPlan.update({
              where: { id: plan.id },
              data: { isDefault: true },
            });
            plan.isDefault = true;
          }
        }

        return mapPlatformPlan(plan);
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ApiBusinessError(
          'Já existe um plano com este nome',
          API_ERROR_CODES.CONFLICT,
          409,
        );
      }
      throw error;
    }
  }

  /**
   * Updates a platform SaaS plan.
   */
  async update(id: string, input: PlatformPlanInput) {
    const existing = await prisma.platformPlan.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiBusinessError('Plano não encontrado', API_ERROR_CODES.NOT_FOUND, 404);
    }

    if (input.isDefault === false && existing.isDefault) {
      const otherActiveDefault = await prisma.platformPlan.count({
        where: { id: { not: id }, active: true },
      });
      if (otherActiveDefault === 0) {
        throw new ApiBusinessError(
          'Defina outro plano padrão antes de remover o padrão atual',
          API_ERROR_CODES.NOT_ALLOWED,
          400,
        );
      }
    }

    if (input.active === false && existing.isDefault) {
      throw new ApiBusinessError(
        'Defina outro plano padrão antes de desativar o plano padrão',
        API_ERROR_CODES.NOT_ALLOWED,
        400,
      );
    }

    return await prisma.$transaction(async (tx) => {
      if (input.isDefault && !existing.isDefault) {
        await tx.platformPlan.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const plan = await tx.platformPlan.update({
        where: { id },
        data: {
          name: input.name,
          priceCents: input.priceCents,
          billingCycle: 'monthly',
          maxCustomers: input.maxCustomers ?? null,
          active: input.active,
          isDefault: input.isDefault,
        },
        include: {
          _count: {
            select: {
              subscriptions: {
                where: { status: { in: ['active', 'past_due'] } },
              },
            },
          },
        },
      });

      return mapPlatformPlan(plan);
    });
  }

  /**
   * Soft-deletes a platform plan when it has active subscriptions, otherwise removes it.
   */
  async remove(id: string) {
    const existing = await prisma.platformPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: { status: { in: ['active', 'past_due'] } },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new ApiBusinessError('Plano não encontrado', API_ERROR_CODES.NOT_FOUND, 404);
    }

    if (existing.isDefault) {
      throw new ApiBusinessError(
        'Defina outro plano padrão antes de excluir este plano',
        API_ERROR_CODES.NOT_ALLOWED,
        400,
      );
    }

    if (existing._count.subscriptions > 0) {
      const plan = await prisma.platformPlan.update({
        where: { id },
        data: { active: false },
        include: {
          _count: {
            select: {
              subscriptions: {
                where: { status: { in: ['active', 'past_due'] } },
              },
            },
          },
        },
      });
      return mapPlatformPlan(plan);
    }

    await prisma.platformPlan.delete({ where: { id } });
    return mapPlatformPlan(existing);
  }
}
