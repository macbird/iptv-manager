import { describe, expect, it, vi } from 'vitest';
import { buildExpiresAtFilter, CustomersService } from './customers.service';

describe('buildExpiresAtFilter', () => {
  it('testBuildExpiresAtFilter_whenExpiredOnly_shouldTakePriorityOverUpcoming', () => {
    const filter = buildExpiresAtFilter({ expiredOnly: 'true', upcomingOnly: 'true' });
    expect(filter.expiresAt).toHaveProperty('lt');
    expect(filter.expiresAt).not.toHaveProperty('gte');
  });

  it('testBuildExpiresAtFilter_whenExpiringWithinDays_shouldSetRange', () => {
    const filter = buildExpiresAtFilter({ expiringWithinDays: '7' });
    expect(filter.expiresAt).toMatchObject({
      gte: expect.any(Date),
      lte: expect.any(Date),
    });
  });
});

describe('CustomersService tenant isolation', () => {
  it('list scopes query by tenantId', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const count = vi.fn().mockResolvedValue(0);
    const service = new CustomersService({
      customer: { findMany, count },
    } as never);

    await service.list('tenant-a', 1, 10, 'joao');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-a' }),
      }),
    );
    expect(count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-a' }),
      }),
    );
  });

  it('findById includes tenantId in where', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const service = new CustomersService({
      customer: { findFirst },
    } as never);

    await service.findById('tenant-b', 'customer-1');

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'customer-1', tenantId: 'tenant-b' },
      }),
    );
  });

  it('deactivate requires matching tenant before update', async () => {
    const findFirstOrThrow = vi.fn().mockResolvedValue({ id: 'c1' });
    const update = vi.fn().mockResolvedValue({ id: 'c1', status: 'inactive' });
    const service = new CustomersService({
      customer: { findFirstOrThrow, update },
    } as never);

    await service.deactivate('tenant-c', 'c1');

    expect(findFirstOrThrow).toHaveBeenCalledWith({
      where: { id: 'c1', tenantId: 'tenant-c' },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { status: 'inactive' },
    });
  });
});
