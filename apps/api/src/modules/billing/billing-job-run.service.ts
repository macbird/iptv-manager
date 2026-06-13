import type { BillingJobRunGlobalSummaryDto } from '@client-manager/shared';
import { prisma } from '../../core/database';

/**
 * Read-only access to global billing scheduler job runs.
 *
 * @author João Paulo da Silva
 * @since 4.9.0
 * @creationDate 12/06/2026

 */
export class BillingJobRunService {
  /**
   * Returns the most recent global billing job run summary.
   */
  async getLastGlobalRun(): Promise<BillingJobRunGlobalSummaryDto> {
    const run = await prisma.billingJobRun.findFirst({
      orderBy: { startedAt: 'desc' },
    });

    if (!run) {
      return emptyGlobalRun();
    }

    const summary = parseGlobalSummary(run.summary);
    return {
      runAt: (run.finishedAt ?? run.startedAt).toISOString(),
      status: run.status,
      ...summary,
    };
  }
}

function parseGlobalSummary(value: unknown) {
  if (!value || typeof value !== 'object') {
    return {
      tenantsProcessed: 0,
      invoicesCreated: 0,
      chargesSent: 0,
      errorsCount: 0,
      errors: [] as string[],
    };
  }

  const record = value as Record<string, unknown>;
  const tenantSummary = (record.tenant ?? record) as Record<string, unknown>;
  const platformSummary = (record.platform ?? {}) as Record<string, unknown>;
  const errors = [
    ...(Array.isArray(tenantSummary.errors)
      ? tenantSummary.errors.filter((item): item is string => typeof item === 'string')
      : []),
    ...(Array.isArray(platformSummary.errors)
      ? platformSummary.errors.filter((item): item is string => typeof item === 'string')
      : []),
  ];

  return {
    tenantsProcessed: Number(tenantSummary.tenantsProcessed ?? 0),
    invoicesCreated:
      Number(tenantSummary.invoicesCreated ?? 0) + Number(platformSummary.invoicesCreated ?? 0),
    chargesSent:
      Number(tenantSummary.chargesSent ?? 0) + Number(platformSummary.chargesSent ?? 0),
    errorsCount: errors.length,
    errors,
  };
}

function emptyGlobalRun(): BillingJobRunGlobalSummaryDto {
  return {
    runAt: null,
    status: null,
    tenantsProcessed: 0,
    invoicesCreated: 0,
    chargesSent: 0,
    errorsCount: 0,
    errors: [],
  };
}
