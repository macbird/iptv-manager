import type { Prisma } from '@prisma/client';
import { AUDIT_ACTION_LABELS, type AuditLogListItem } from '@client-manager/shared';
import { prisma } from '../../core/database';

export interface AuditLogInput {
  tenantId: string;
  accountUserId?: string | null;
  entityType: string;
  action: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Persists tenant-scoped audit events for critical operations.
 */
export class AuditService {
  /**
   * Records an audit log entry.
   */
  async log(input: AuditLogInput): Promise<void> {
    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        accountUserId: input.accountUserId ?? null,
        entityType: input.entityType,
        action: input.action,
        entityId: input.entityId ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  /**
   * Lists audit logs for a tenant with optional text filter on action/entity.
   */
  async list(
    tenantId: string,
    page: number,
    pageSize: number,
    filter = '',
  ): Promise<{ data: AuditLogListItem[]; total: number }> {
    const trimmed = filter.trim();
    const where = {
      tenantId,
      ...(trimmed
        ? {
            OR: [
              { action: { contains: trimmed, mode: 'insensitive' as const } },
              { entityType: { contains: trimmed, mode: 'insensitive' as const } },
              { entityId: { contains: trimmed, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          accountUser: { select: { name: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        entityType: row.entityType,
        action: row.action,
        actionLabel: AUDIT_ACTION_LABELS[row.action] ?? row.action,
        entityId: row.entityId,
        actorName: row.accountUser?.name ?? null,
        metadata: (row.metadata as Record<string, unknown> | null) ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
      total,
    };
  }
}

const auditService = new AuditService();

/**
 * Fire-and-forget audit logging; failures are logged but do not break the main flow.
 */
export function auditLogFireAndForget(input: AuditLogInput): void {
  void auditService.log(input).catch((error) => {
    console.warn(
      '[audit-log] failed to persist',
      error instanceof Error ? error.message : error,
    );
  });
}
