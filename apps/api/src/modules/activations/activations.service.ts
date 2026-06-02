import { prisma } from '../../core/database';
import type { BillingCycle, ConnectionRenewalStatus, Prisma } from '@prisma/client';
import { extendExpiryFromDate, resolveRenewalBaseDate } from './activation-expiry.util';

function mapTask(row: {
  id: string;
  status: ConnectionRenewalStatus;
  paidAt: Date;
  completedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  customer: { id: string; name: string; phone: string | null; expiresAt: Date | null };
  connection: {
    id: string;
    macAddress: string;
    applicationName: string;
    label: string | null;
    server: { id: string; name: string };
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
    customer: {
      id: row.customer.id,
      name: row.customer.name,
      phone: row.customer.phone,
      expiresAt: row.customer.expiresAt?.toISOString() ?? null,
    },
    connection: {
      id: row.connection.id,
      macAddress: row.connection.macAddress,
      applicationName: row.connection.applicationName,
      label: row.connection.label,
      server: row.connection.server,
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

const taskInclude = {
  customer: {
    select: { id: true, name: true, phone: true, expiresAt: true },
  },
  connection: {
    select: {
      id: true,
      macAddress: true,
      applicationName: true,
      label: true,
      server: { select: { id: true, name: true } },
    },
  },
  payment: {
    select: { id: true, amountCents: true, method: true, paidAt: true },
  },
  invoice: {
    select: { id: true, billingCycleKey: true },
  },
} as const;

export class ActivationsService {
  /**
   * Lists connection renewal tasks (Ativações pendentes) for a tenant.
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
              { connection: { macAddress: { contains: trimmed, mode: 'insensitive' as const } } },
              { connection: { server: { name: { contains: trimmed, mode: 'insensitive' as const } } } },
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
        include: taskInclude,
      }),
      prisma.connectionRenewalTask.count({ where }),
    ]);

    return {
      data: rows.map(mapTask),
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
   * Creates one pending task per customer connection after a tenant-scope payment is confirmed.
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
    const connections = await tx.connection.findMany({
      where: { customerId: params.customerId },
      select: { id: true },
    });

    if (connections.length === 0) {
      throw new Error(
        'Cliente não possui conexões cadastradas. Cadastre um MAC antes de registrar o pagamento.',
      );
    }

    const tasks = await Promise.all(
      connections.map((connection) =>
        tx.connectionRenewalTask.create({
          data: {
            tenantId: params.tenantId,
            customerId: params.customerId,
            connectionId: connection.id,
            paymentId: params.paymentId,
            invoiceId: params.invoiceId,
            paidAt: params.paidAt,
            status: 'pending',
          },
          include: taskInclude,
        }),
      ),
    );

    return tasks.map(mapTask);
  }

  /**
   * Marks an activation as completed on the server and extends customer expiry when all
   * tasks for the same payment are done.
   */
  async complete(taskId: string, tenantId: string, notes?: string) {
    const task = await prisma.connectionRenewalTask.findFirst({
      where: { id: taskId, tenantId },
      include: {
        customer: { include: { plan: true } },
        connection: {
          select: {
            id: true,
            macAddress: true,
            applicationName: true,
            label: true,
            server: { select: { id: true, name: true } },
          },
        },
        payment: {
          select: { id: true, amountCents: true, method: true, paidAt: true },
        },
        invoice: {
          select: { id: true, billingCycleKey: true },
        },
      },
    });

    if (!task) {
      throw new Error('Activation not found');
    }

    if (task.status !== 'pending') {
      throw new Error('Activation is not pending');
    }

    const completedAt = new Date();

    await prisma.connectionRenewalTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        completedAt,
        notes: notes?.trim() || task.notes,
      },
    });

    const pendingForPayment = await prisma.connectionRenewalTask.count({
      where: {
        paymentId: task.paymentId,
        status: 'pending',
      },
    });

    if (pendingForPayment === 0) {
      const billingCycle: BillingCycle = task.customer.plan?.billingCycle ?? 'monthly';
      const baseDate = resolveRenewalBaseDate(task.customer.expiresAt, completedAt);
      const newExpiresAt = extendExpiryFromDate(baseDate, billingCycle);

      await prisma.customer.update({
        where: { id: task.customerId },
        data: { expiresAt: newExpiresAt },
      });
    }

    const updated = await prisma.connectionRenewalTask.findFirst({
      where: { id: taskId },
      include: taskInclude,
    });

    if (!updated) {
      throw new Error('Activation not found after update');
    }

    const customer = await prisma.customer.findUnique({
      where: { id: task.customerId },
      select: { expiresAt: true },
    });

    return {
      ...mapTask({ ...updated, customer: { ...updated.customer, expiresAt: customer?.expiresAt ?? null } }),
      customerExpiresAtUpdated: pendingForPayment === 0,
      newExpiresAt: pendingForPayment === 0 ? customer?.expiresAt?.toISOString() ?? null : null,
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
      throw new Error('Activation not found');
    }

    if (task.status === status) {
      throw new Error('Status unchanged');
    }

    if (status === 'completed') {
      if (task.status !== 'pending') {
        throw new Error('Only pending activations can be completed');
      }
      return this.complete(taskId, tenantId, notes);
    }

    if (status === 'cancelled') {
      if (task.status !== 'pending') {
        throw new Error('Only pending activations can be cancelled');
      }

      const updated = await prisma.connectionRenewalTask.update({
        where: { id: taskId },
        data: {
          status: 'cancelled',
          completedAt: null,
          notes: notes?.trim() || task.notes,
        },
        include: taskInclude,
      });

      return mapTask(updated);
    }

    if (status === 'pending') {
      if (task.status !== 'cancelled') {
        throw new Error('Only cancelled activations can be reopened');
      }

      const updated = await prisma.connectionRenewalTask.update({
        where: { id: taskId },
        data: {
          status: 'pending',
          completedAt: null,
          notes: notes?.trim() || task.notes,
        },
        include: taskInclude,
      });

      return mapTask(updated);
    }

    throw new Error('Invalid status transition');
  }
}
