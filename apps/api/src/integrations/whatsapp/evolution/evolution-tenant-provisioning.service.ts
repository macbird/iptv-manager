import { encryptCredential } from '../../../core/crypto/credential-crypto';
import { prisma } from '../../../core/database';
import { EvolutionAdminClient } from '../evolution-admin.client';
import { buildEvolutionInstanceUrl } from '../evolution-config.util';
import { getEvolutionPlatformConfig } from './evolution-platform.config';
import { EvolutionWhatsAppError } from './evolution-whatsapp.errors';

/**
 * Provisions Evolution WhatsApp instances for tenant accounts.
 *
 * @author João Paulo da Silva
 * @since 4.9.0
 * @creationDate 14/06/2026
 */
export class EvolutionTenantProvisioningService {
  /**
   * Ensures an Evolution instance exists for the tenant and persists WhatsApp config.
   * Does not throw when Evolution is unavailable — callers should treat this as best-effort.
   */
  async provisionForAccount(accountId: string, slug: string): Promise<boolean> {
    const platform = getEvolutionPlatformConfig();
    if (!platform) {
      console.warn(
        `[evolution-provision] skipped account ${accountId}: EVOLUTION_BASE_URL / EVOLUTION_API_KEY missing`,
      );
      return false;
    }

    const instanceName = slug.trim();
    if (!instanceName) {
      console.warn(`[evolution-provision] skipped account ${accountId}: empty slug`);
      return false;
    }

    const client = new EvolutionAdminClient(platform.baseUrl, platform.apiKey);
    const instanceUrl = buildEvolutionInstanceUrl(platform.baseUrl, instanceName);
    const encryptedApiKey = encryptCredential(platform.apiKey);

    try {
      await client.ensureInstance({ instanceName, token: instanceName });
    } catch (error) {
      console.warn(
        `[evolution-provision] ensureInstance failed for ${instanceName}:`,
        error instanceof Error ? error.message : error,
      );
      return false;
    }

    await prisma.tenantWhatsappConfig.upsert({
      where: { accountId },
      create: {
        accountId,
        provider: 'evolution',
        instanceUrl,
        apiKey: encryptedApiKey,
        connectionStatus: 'disconnected',
      },
      update: {
        provider: 'evolution',
        instanceUrl,
        apiKey: encryptedApiKey,
      },
    });

    console.info(`[evolution-provision] instance ready for account ${accountId} (${instanceName})`);
    return true;
  }

  /**
   * Deletes and recreates the Evolution instance for a tenant.
   * Does not connect WhatsApp or bind a phone — the tenant links later in settings.
   */
  async recreateForAccount(accountId: string, slug: string): Promise<void> {
    const platform = getEvolutionPlatformConfig();
    if (!platform) {
      throw new EvolutionWhatsAppError(
        'Evolution não configurada no servidor (EVOLUTION_BASE_URL / EVOLUTION_API_KEY).',
        'NOT_CONFIGURED',
      );
    }

    const instanceName = slug.trim();
    if (!instanceName) {
      throw new EvolutionWhatsAppError('Conta sem slug configurado.', 'NO_ACCOUNT');
    }

    const client = new EvolutionAdminClient(platform.baseUrl, platform.apiKey);
    const instanceUrl = buildEvolutionInstanceUrl(platform.baseUrl, instanceName);
    const encryptedApiKey = encryptCredential(platform.apiKey);

    await client.logoutInstance(instanceName).catch(() => undefined);
    await client.deleteInstance(instanceName);
    await client.createInstance({ instanceName, token: instanceName });

    await prisma.tenantWhatsappConfig.upsert({
      where: { accountId },
      create: {
        accountId,
        provider: 'evolution',
        instanceUrl,
        apiKey: encryptedApiKey,
        connectionStatus: 'disconnected',
        displayPhoneNumber: null,
      },
      update: {
        provider: 'evolution',
        instanceUrl,
        apiKey: encryptedApiKey,
        connectionStatus: 'disconnected',
        displayPhoneNumber: null,
      },
    });

    console.info(`[evolution-provision] instance recreated for account ${accountId} (${instanceName})`);
  }
}
