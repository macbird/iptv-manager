import type { AccountEvolutionIntegrity } from '@client-manager/shared';
import {
  detectEvolutionInstanceAnomalies,
  resolveEvolutionIntegrityStatus,
} from '@client-manager/shared';
import { prisma } from '../../../core/database';
import type { EvolutionInstanceSummary } from '../evolution-admin.client';
import { EvolutionAdminClient } from '../evolution-admin.client';
import { formatEvolutionDisplayPhone } from './evolution-state.util';
import { getEvolutionPlatformConfig } from './evolution-platform.config';

export interface AccountEvolutionIntegrityInput {
  id: string;
  slug: string;
}

/**
 * Resolves Evolution instance integrity for admin account listings.
 *
 * @author João Paulo da Silva
 * @since 4.9.0
 * @creationDate 14/06/2026
 */
export class EvolutionAccountIntegrityService {
  /**
   * Returns Evolution integrity for each account on the current list page.
   */
  async resolveForAccounts(
    accounts: AccountEvolutionIntegrityInput[],
  ): Promise<Map<string, AccountEvolutionIntegrity>> {
    const result = new Map<string, AccountEvolutionIntegrity>();
    if (accounts.length === 0) {
      return result;
    }

    const platform = getEvolutionPlatformConfig();
    if (!platform) {
      for (const account of accounts) {
        result.set(account.id, {
          status: 'not_configured',
          instanceName: account.slug || null,
          displayPhoneNumber: null,
          anomalies: [],
        });
      }
      return result;
    }

    const accountIds = accounts.map((account) => account.id);
    const whatsappRows = await prisma.tenantWhatsappConfig.findMany({
      where: { accountId: { in: accountIds } },
      select: {
        accountId: true,
        instanceUrl: true,
        apiKey: true,
        displayPhoneNumber: true,
        connectionStatus: true,
      },
    });
    const whatsappByAccountId = new Map(whatsappRows.map((row) => [row.accountId, row]));

    let remoteInstances = new Map<string, EvolutionInstanceSummary>();
    let remoteCheckFailed = false;
    try {
      const client = new EvolutionAdminClient(platform.baseUrl, platform.apiKey);
      remoteInstances = await client.fetchAllInstances();
    } catch (error) {
      remoteCheckFailed = true;
      console.warn(
        '[evolution-integrity] fetchAllInstances failed:',
        error instanceof Error ? error.message : error,
      );
    }

    for (const account of accounts) {
      result.set(
        account.id,
        this.resolveOneAccount({
          account,
          whatsapp: whatsappByAccountId.get(account.id),
          remoteInstances,
          remoteCheckFailed,
        }),
      );
    }

    return result;
  }

  /**
   * Counts tenant accounts with Evolution operational anomalies for the admin dashboard.
   */
  async countAccountsWithAnomalies(): Promise<number> {
    const platform = getEvolutionPlatformConfig();
    if (!platform) {
      return 0;
    }

    const accounts = await prisma.account.findMany({
      where: { status: 'active', slug: { not: '' } },
      select: { id: true, slug: true },
    });

    const resolved = await this.resolveForAccounts(
      accounts.map((account) => ({ id: account.id, slug: account.slug })),
    );

    let count = 0;
    for (const integrity of resolved.values()) {
      if (integrity.anomalies.length > 0 || integrity.status === 'stale_session') {
        count += 1;
      }
    }

    return count;
  }

  private resolveOneAccount(input: {
    account: AccountEvolutionIntegrityInput;
    whatsapp:
      | {
          instanceUrl: string | null;
          apiKey: string | null;
          displayPhoneNumber: string | null;
          connectionStatus: string;
        }
      | undefined;
    remoteInstances: Map<string, EvolutionInstanceSummary>;
    remoteCheckFailed: boolean;
  }): AccountEvolutionIntegrity {
    const instanceName = input.account.slug?.trim() || null;
    const whatsapp = input.whatsapp;
    const dbConfigured = Boolean(whatsapp?.instanceUrl && whatsapp?.apiKey);
    const remote = instanceName ? input.remoteInstances.get(instanceName) : undefined;
    const status = resolveEvolutionIntegrityStatus({
      evolutionConfigured: true,
      instanceName,
      dbConfigured,
      remote,
      remoteCheckFailed: input.remoteCheckFailed,
    });

    const anomalies = detectEvolutionInstanceAnomalies({
      dbConnectionStatus: whatsapp?.connectionStatus,
      remote,
    });

    const displayPhoneNumber =
      whatsapp?.displayPhoneNumber ??
      formatEvolutionDisplayPhone(remote?.number, remote?.ownerJid);

    return {
      status,
      instanceName,
      displayPhoneNumber,
      anomalies,
    };
  }
}
