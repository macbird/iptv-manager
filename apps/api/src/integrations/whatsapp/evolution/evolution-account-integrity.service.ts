import type { AccountEvolutionIntegrity } from '@client-manager/shared';
import { resolveEvolutionIntegrityStatus } from '@client-manager/shared';
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
      const instanceName = account.slug?.trim() || null;
      const whatsapp = whatsappByAccountId.get(account.id);
      const dbConfigured = Boolean(whatsapp?.instanceUrl && whatsapp?.apiKey);
      const remote = instanceName ? remoteInstances.get(instanceName) : undefined;
      const status = resolveEvolutionIntegrityStatus({
        evolutionConfigured: true,
        instanceName,
        dbConfigured,
        remote,
        remoteCheckFailed,
      });

      const displayPhoneNumber =
        whatsapp?.displayPhoneNumber ??
        formatEvolutionDisplayPhone(remote?.number, remote?.ownerJid);

      result.set(account.id, {
        status,
        instanceName,
        displayPhoneNumber,
      });
    }

    return result;
  }
}
