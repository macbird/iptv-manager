import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
}));

vi.mock('../../core/database', () => ({
  prisma: {
    auditLog: {
      create: mocks.create,
      findMany: mocks.findMany,
      count: mocks.count,
    },
  },
}));

import { AuditService, auditLogFireAndForget } from './audit.service';

/**
 * Unit tests for tenant audit logging.
 */
describe('AuditService', () => {
  const service = new AuditService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('testLog_whenValidInput_shouldPersistAuditRow', async () => {
    mocks.create.mockResolvedValue({ id: 'log-1' });

    await service.log({
      tenantId: 'tenant-a',
      accountUserId: 'user-1',
      entityType: 'customer',
      action: 'customer.created',
      entityId: 'cust-1',
      metadata: { name: 'Maria Silva' },
    });

    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-a',
        accountUserId: 'user-1',
        entityType: 'customer',
        action: 'customer.created',
        entityId: 'cust-1',
        metadata: { name: 'Maria Silva' },
      },
    });
  });

  it('testList_whenFilterProvided_shouldQueryWithOrClause', async () => {
    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);

    await service.list('tenant-a', 2, 10, 'payment');

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-a',
          OR: expect.arrayContaining([
            { action: { contains: 'payment', mode: 'insensitive' } },
          ]),
        }),
        skip: 10,
        take: 10,
      }),
    );
  });

  it('testList_whenRowsExist_shouldMapActionLabel', async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: 'log-2',
        entityType: 'payment',
        action: 'payment.confirmed',
        entityId: 'pay-1',
        metadata: null,
        createdAt: new Date('2026-06-13T12:00:00.000Z'),
        accountUser: { name: 'João' },
      },
    ]);
    mocks.count.mockResolvedValue(1);

    const result = await service.list('tenant-a', 1, 20, '');

    expect(result.total).toBe(1);
    expect(result.data[0]).toMatchObject({
      action: 'payment.confirmed',
      actionLabel: 'Pagamento confirmado',
      actorName: 'João',
    });
  });
});

describe('auditLogFireAndForget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue({ id: 'log-3' });
  });

  it('testAuditLogFireAndForget_whenPersistFails_shouldNotThrow', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mocks.create.mockRejectedValueOnce(new Error('db unavailable'));

    expect(() =>
      auditLogFireAndForget({
        tenantId: 'tenant-a',
        entityType: 'invoice',
        action: 'invoice.charge_sent',
        entityId: 'inv-1',
      }),
    ).not.toThrow();

    await vi.waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        '[audit-log] failed to persist',
        'db unavailable',
      );
    });

    warnSpy.mockRestore();
  });
});
