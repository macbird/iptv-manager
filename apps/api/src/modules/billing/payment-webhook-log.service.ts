import { prisma } from '../../core/database';

export interface WebhookLogInput {
  accountId?: string | null;
  tenantRef: string;
  provider?: string;
  httpMethod: string;
  paymentId?: string | null;
  statusCode: number;
  outcome: string;
  detail?: string | null;
  errorMessage?: string | null;
}

/**
 * Persists payment webhook delivery attempts for troubleshooting.
 */
export class PaymentWebhookLogService {
  /**
   * Records a webhook attempt.
   */
  async record(input: WebhookLogInput) {
    let accountId = input.accountId ?? null;
    if (!accountId && input.tenantRef !== 'platform') {
      const account = await prisma.account.findFirst({
        where: {
          OR: [
            { id: input.tenantRef },
            { slug: input.tenantRef },
            { slug: input.tenantRef.replace(/%20/g, ' ') },
          ],
        },
        select: { id: true },
      });
      accountId = account?.id ?? null;
    }

    return prisma.paymentWebhookLog.create({
      data: {
        accountId,
        tenantSlug: input.tenantRef,
        provider: input.provider ?? 'mercadopago',
        httpMethod: input.httpMethod,
        paymentId: input.paymentId ?? null,
        statusCode: input.statusCode,
        outcome: input.outcome,
        detail: input.detail ?? null,
        errorMessage: input.errorMessage ?? null,
      },
    });
  }

  /**
   * Lists recent webhook logs for a tenant account.
   */
  async listForTenant(accountId: string, limit = 50) {
    const rows = await prisma.paymentWebhookLog.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return rows.map((row) => ({
      id: row.id,
      tenantSlug: row.tenantSlug,
      provider: row.provider,
      httpMethod: row.httpMethod,
      paymentId: row.paymentId,
      statusCode: row.statusCode,
      outcome: row.outcome,
      detail: row.detail,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt.toISOString(),
    }));
  }
}
