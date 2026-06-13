import { describe, expect, it, vi, beforeEach } from 'vitest';
import { API_ERROR_CODES } from '@client-manager/shared';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  count: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  deletePlan: vi.fn(),
}));

vi.mock('../../core/database', () => ({
  prisma: {
    platformPlan: {
      findMany: mocks.findMany,
      count: mocks.count,
      findUnique: mocks.findUnique,
      create: vi.fn(),
      update: mocks.update,
      updateMany: vi.fn(),
      delete: mocks.deletePlan,
    },
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        platformPlan: {
          updateMany: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          count: vi.fn(),
        },
      }),
    ),
  },
}));

import { PlatformPlansService } from './platform-plans.service';

/**
 * Unit tests for {@link PlatformPlansService}.
 *
 * @author João Paulo da Silva
 * @since 4.9.0
 */
describe('PlatformPlansService', () => {
  const service = new PlatformPlansService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('testList_whenSelectableOnly_shouldFilterActivePlans', async () => {
    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);

    await service.list(1, 10, '', true);

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ active: true }),
      }),
    );
  });

  it('testRemove_whenPlanIsDefault_shouldThrowNotAllowed', async () => {
    mocks.findUnique.mockResolvedValue({
      id: 'plan-1',
      name: 'Default',
      priceCents: 1000,
      billingCycle: 'monthly',
      maxCustomers: null,
      active: true,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { subscriptions: 0 },
    });

    await expect(service.remove('plan-1')).rejects.toMatchObject({
      code: API_ERROR_CODES.NOT_ALLOWED,
    });
  });

  it('testRemove_whenPlanHasSubscriptions_shouldSoftDelete', async () => {
    mocks.findUnique.mockResolvedValue({
      id: 'plan-2',
      name: 'Pro',
      priceCents: 9900,
      billingCycle: 'monthly',
      maxCustomers: null,
      active: true,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { subscriptions: 3 },
    });
    mocks.update.mockResolvedValue({
      id: 'plan-2',
      name: 'Pro',
      priceCents: 9900,
      billingCycle: 'monthly',
      maxCustomers: null,
      active: false,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { subscriptions: 3 },
    });

    const result = await service.remove('plan-2');

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 'plan-2' },
      data: { active: false },
      include: expect.any(Object),
    });
    expect(result.active).toBe(false);
    expect(mocks.deletePlan).not.toHaveBeenCalled();
  });
});
