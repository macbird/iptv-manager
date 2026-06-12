import { prisma } from '../../core/database';
import { safeDecryptCredential } from '../../core/crypto/credential-crypto';
import { API_ERROR_CODES, ApiBusinessError } from '@client-manager/shared';
import type { BillingCycle, ConnectionRenewalStatus, Prisma } from '@prisma/client';
import { extendExpiryFromDate, resolveRenewalBaseDate } from './activation-expiry.util';

const listInclude = {
  customer: {
    select: {
      id: true,
      name: true,
      phone: true,
      expiresAt: true,
      _count: { select: { connections: true } },
    },
  },
  payment: {
    select: { id: true, amountCents: true, method: true, paidAt: true },
  },
  invoice: {
    select: { id: true, billingCycleKey: true },
  },
} as const;

function mapListItem(row: {
  id: string;
  status: ConnectionRenewalStatus;
  paidAt: Date;
  completedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    expiresAt: Date | null;
    _count: { connections: number };
  };
  payment: { id: string; amountCents: number; method: string; paidAt: Date };
  invoice: { id: string; billingCycleKey: string } | null;
}) {
  return {
    id: row.id,
    status: row.status,
    paidAt: row.paidAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    connectionCount: row.customer._count.connections,
    customer: {
      id: row.customer.id,
      name: row.customer.name,
      phone: row.customer.phone,
      expiresAt: row.customer.expiresAt?.toISOString() ?? null,
    },
    payment: {
      id: row.payment.id,
      amountCents: row.payment.amountCents,
      method: row.payment.method,
      paidAt: row.payment.paidAt.toISOString(),
    },
    invoice: row.invoice,
  };
}

function mapConnectionDetail(connection: {
  id: string;
  label: string | null;
  macAddress: string;
  applicationName: string;
  m3u8Link: string | null;
  server: {
    id: string;
    name: string;
    panelUrl: string;
    panelUsername: string | null;
    panelPasswordEncrypted: string | null;
    panelNotes: string | null;
  };
}) {
  return {
    id: connection.id,
    label: connection.label,
    macAddress: connection.macAddress,
    applicationName: connection.applicationName,
    m3u8Link: connection.m3u8Link,
    server: {
      id: connection.server.id,
      name: connection.server.name,
      panelUrl: connection.server.panelUrl,
      panelUsername: connection.server.panelUsername,
      panelPassword: safeDecryptCredential(connection.server.panelPasswordEncrypted),
      panelNotes: connection.server.panelNotes,
    },
  };
}

export class ActivationsService {
  /**
   * Lists payment activations (one per payment) for a tenant.
   */
  async list(
    tenantId: string,
    page: number,
    pageSize: number,
    filter: string,
    status?: ConnectionRenewalStatus,
  ) {
    const skip = (page - 1) * pageSize;
    const trimmed = filter.trim();

    const where = {
      tenantId,
      ...(status ? { status } : {}),
      ...(trimmed
        ? {
            OR: [
              { customer: { name: { contains: trimmed, mode: 'insensitive' as const } } },
              { customer: { phone: { contains: trimmed, mode: 'insensitive' as const } } },
              {
                customer: {
                  connections: {
                    some: {
                      OR: [
                        { macAddress: { contains: trimmed, mode: 'insensitive' as const } },
                        { applicationName: { contains: trimmed, mode: 'insensitive' as const } },
                        { server: { name: { contains: trimmed, mode: 'insensitive' as const } } },
                      ],
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.connectionRenewalTask.findMany({
        where,
        orderBy: [{ status: 'asc' }, { paidAt: 'desc' }],
        skip,
        take: pageSize,
        include: listInclude,
      }),
      prisma.connectionRenewalTask.count({ where }),
    ]);

    return {
      data: rows.map(mapListItem),
      total,
    };
  }

  /**
   * Returns pending activation count for dashboard KPIs.
   */
  async countPending(tenantId: string): Promise<number> {
    return prisma.connectionRenewalTask.count({
      where: { tenantId, status: 'pending' },
    });
  }

  /**
   * Returns activation with all customer connections and server credentials for the work screen.
   */
  async findById(tenantId: string, id: string) {
    const task = await prisma.connectionRenewalTask.findFirst({
      where: { id, tenantId },
      include: listInclude,
    });

    if (!task) return null;

    const connections = await prisma.connection.findMany({
      where: { customerId: task.customerId },
      include: {
        server: {
          select: {
            id: true,
            name: true,
            panelUrl: true,
            panelUsername: true,
            panelPasswordEncrypted: true,
            panelNotes: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      ...mapListItem(task),
      connections: connections.map(mapConnectionDetail),
    };
  }

  /**
   * Creates a single pending activation per payment (idempotent).
   */
  async createTasksForPayment(
    params: {
      tenantId: string;
      customerId: string;
      paymentId: string;
      invoiceId: string | null;
      paidAt: Date;
    },
    tx: Prisma.TransactionClient = prisma,
  ) {
    const connectionCount = await tx.connection.count({
      where: { customerId: params.customerId },
    });

    if (connectionCount === 0) {
      throw new ApiBusinessError(
        'Cliente não possui conexões cadastradas. Cadastre um MAC antes de registrar o pagamento.',
        API_ERROR_CODES.NOT_ALLOWED,
        400,
      );
    }

    const task = await tx.connectionRenewalTask.upsert({
      where: { paymentId: params.paymentId },
      create: {
        tenantId: params.tenantId,
        customerId: params.customerId,
        paymentId: params.paymentId,
        invoiceId: params.invoiceId,
        paidAt: params.paidAt,
        status: 'pending',
      },
      update: {},
      include: listInclude,
    });

    return [mapListItem(task)];
  }

  /**
   * Completes the activation and renews customer expiry per plan billing cycle.
   */
  async complete(taskId: string, tenantId: string, notes?: string) {
    const task = await prisma.connectionRenewalTask.findFirst({
      where: { id: taskId, tenantId },
      include: {
        customer: { include: { plan: true } },
      },
    });

    if (!task) {
      throw new ApiBusinessError('Ativação não encontrada', API_ERROR_CODES.NOT_FOUND, 404);
    }

    if (task.status !== 'pending') {
      throw new ApiBusinessError(
        'A ativação não está pendente',
        API_ERROR_CODES.NOT_ALLOWED,
        400,
      );
    }

    const completedAt = new Date();
    const billingCycle: BillingCycle = task.customer.plan?.billingCycle ?? 'monthly';
    const baseDate = resolveRenewalBaseDate(task.customer.expiresAt, completedAt);
    const newExpiresAt = extendExpiryFromDate(baseDate, billingCycle);

    await prisma.$transaction([
      prisma.connectionRenewalTask.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          completedAt,
          notes: notes?.trim() || task.notes,
        },
      }),
      prisma.customer.update({
        where: { id: task.customerId },
        data: { expiresAt: newExpiresAt },
      }),
    ]);

    const detail = await this.findById(tenantId, taskId);
    if (!detail) {
      throw new ApiBusinessError('Ativação não encontrada', API_ERROR_CODES.NOT_FOUND, 404);
    }

    return {
      ...detail,
      customerExpiresAtUpdated: true,
      newExpiresAt: newExpiresAt.toISOString(),
    };
  }

  /**
   * Updates activation status with allowed transitions.
   */
  async updateStatus(
    taskId: string,
    tenantId: string,
    status: ConnectionRenewalStatus,
    notes?: string,
  ) {
    const task = await prisma.connectionRenewalTask.findFirst({
      where: { id: taskId, tenantId },
    });

    if (!task) {
      throw new ApiBusinessError('Ativação não encontrada', API_ERROR_CODES.NOT_FOUND, 404);
    }

    if (task.status === status) {
      throw new ApiBusinessError('Status já está definido', API_ERROR_CODES.NOT_ALLOWED, 400);
    }

    if (status === 'completed') {
      if (task.status !== 'pending') {
        throw new ApiBusinessError(
          'Somente ativações pendentes podem ser concluídas',
          API_ERROR_CODES.NOT_ALLOWED,
          400,
        );
      }
      return this.complete(taskId, tenantId, notes);
    }

    if (status === 'cancelled') {
      if (task.status !== 'pending') {
        throw new ApiBusinessError(
          'Somente ativações pendentes podem ser canceladas',
          API_ERROR_CODES.NOT_ALLOWED,
          400,
        );
      }

      const updated = await prisma.connectionRenewalTask.update({
        where: { id: taskId },
        data: {
          status: 'cancelled',
          completedAt: null,
          notes: notes?.trim() || task.notes,
        },
        include: listInclude,
      });

      return mapListItem(updated);
    }

    if (status === 'pending') {
      if (task.status !== 'cancelled') {
        throw new ApiBusinessError(
          'Somente ativações canceladas podem ser reabertas',
          API_ERROR_CODES.NOT_ALLOWED,
          400,
        );
      }

      const updated = await prisma.connectionRenewalTask.update({
        where: { id: taskId },
        data: {
          status: 'pending',
          completedAt: null,
          notes: notes?.trim() || task.notes,
        },
        include: listInclude,
      });

      return mapListItem(updated);
    }

    throw new ApiBusinessError(
      'Transição de status inválida',
      API_ERROR_CODES.NOT_ALLOWED,
      400,
    );
  }
}
