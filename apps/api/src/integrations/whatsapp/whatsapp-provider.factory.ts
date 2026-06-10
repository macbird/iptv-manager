import type { BillingScope } from '@prisma/client';
import { prisma } from '../../core/database';
import { safeDecryptCredential } from '../../core/crypto/credential-crypto';
import { parseEvolutionConnectionConfig } from './evolution-config.util';
import { EvolutionWhatsAppProvider } from './evolution.provider';
import { MetaWhatsAppProvider } from './meta/meta-whatsapp.provider';
import type { WhatsAppProvider } from './whatsapp-provider.interface';

/**
 * Builds WhatsApp adapters from platform or tenant configuration.
 */
export class WhatsAppProviderFactory {
  /**
   * Returns a configured WhatsApp provider for the billing scope.
   */
  async getProvider(scope: BillingScope, accountId: string): Promise<WhatsAppProvider> {
    if (scope === 'platform') {
      const config = await prisma.platformWhatsappConfig.findUnique({
        where: { id: 'default' },
      });
      return this.buildFromConfig(config);
    }

    const config = await prisma.tenantWhatsappConfig.findUnique({
      where: { accountId },
    });
    return this.buildFromConfig(config);
  }

  private buildFromConfig(
    config: {
      provider: string;
      instanceUrl: string | null;
      apiKey: string | null;
      phoneNumberId: string | null;
      connectionStatus: string;
    } | null,
  ): WhatsAppProvider {
    if (!config) {
      throw new Error(
        'WhatsApp não configurado. Conecte sua conta em Configurações → WhatsApp.',
      );
    }

    if (config.provider === 'meta') {
      if (config.connectionStatus !== 'connected' || !config.apiKey || !config.phoneNumberId) {
        throw new Error(
          'WhatsApp Meta não conectado. Use o Embedded Signup em Configurações → WhatsApp.',
        );
      }

      const accessToken = safeDecryptCredential(config.apiKey) || config.apiKey;
      return new MetaWhatsAppProvider(accessToken, config.phoneNumberId);
    }

    if (!config.instanceUrl || !config.apiKey) {
      throw new Error(
        'WhatsApp Evolution não configurado. Conecte em Configurações → WhatsApp.',
      );
    }

    if (config.connectionStatus !== 'connected') {
      throw new Error(
        'WhatsApp Evolution não conectado. Escaneie o QR ou use o código de pareamento em Configurações.',
      );
    }

    const apiKey = safeDecryptCredential(config.apiKey) || config.apiKey;
    const { baseUrl, instanceName } = parseEvolutionConnectionConfig(config.instanceUrl);

    if (config.provider === 'evolution') {
      return new EvolutionWhatsAppProvider(baseUrl, apiKey, instanceName);
    }

    throw new Error(`Provider WhatsApp "${config.provider}" não suportado`);
  }
}
