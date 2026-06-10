import type { BillingScope } from '@prisma/client';
import type { MetaEmbeddedSignupInput } from '@client-manager/shared';
import { prisma } from '../../../core/database';
import { encryptCredential } from '../../../core/crypto/credential-crypto';
import { getMetaEmbeddedSignupPublicConfig } from './meta-whatsapp.config';
import { MetaGraphClient } from './meta-graph.client';
import { MetaWhatsAppError } from './meta-whatsapp.errors';

type WhatsappConfigRow = {
  id: string;
  provider: string;
  instanceUrl: string | null;
  apiKey: string | null;
  wabaId: string | null;
  phoneNumberId: string | null;
  displayPhoneNumber: string | null;
  connectionStatus: string;
  tokenExpiresAt: Date | null;
};

/**
 * Orchestrates Meta Embedded Signup (Tech Provider) for tenant and platform scopes.
 */
export class MetaEmbeddedSignupService {
  /**
   * Returns frontend config for Meta Embedded Signup SDK.
   */
  getPublicConfig() {
    const config = getMetaEmbeddedSignupPublicConfig();
    if (!config) {
      throw new MetaWhatsAppError(
        'Integração Meta não configurada na plataforma. Defina META_APP_ID, META_APP_SECRET e META_EMBEDDED_SIGNUP_CONFIG_ID.',
        'NOT_CONFIGURED',
      );
    }
    return config;
  }

  /**
   * Completes Embedded Signup: exchanges code, subscribes webhooks and stores tenant credentials.
   */
  async completeSignup(scope: BillingScope, accountId: string, input: MetaEmbeddedSignupInput) {
    const { accessToken, expiresIn } = await MetaGraphClient.exchangeEmbeddedSignupCode(input.code);
    const client = MetaGraphClient.fromPlatformDefaults(accessToken);

    await client.subscribeAppToWaba(input.wabaId);
    const displayPhoneNumber =
      (await client.getPhoneNumberDisplay(input.phoneNumberId)) ?? null;

    const tokenExpiresAt =
      expiresIn != null ? new Date(Date.now() + expiresIn * 1000) : null;

    const payload = {
      provider: 'meta' as const,
      apiKey: encryptCredential(accessToken),
      wabaId: input.wabaId,
      phoneNumberId: input.phoneNumberId,
      displayPhoneNumber,
      connectionStatus: 'connected' as const,
      tokenExpiresAt,
      instanceUrl: null,
    };

    if (scope === 'platform') {
      await prisma.platformWhatsappConfig.upsert({
        where: { id: 'default' },
        create: { id: 'default', ...payload },
        update: payload,
      });
    } else {
      await prisma.tenantWhatsappConfig.upsert({
        where: { accountId },
        create: { accountId, ...payload },
        update: payload,
      });
    }

    return this.getConnection(scope, accountId);
  }

  /**
   * Disconnects Meta WhatsApp for the scope (keeps provider selection).
   */
  async disconnect(scope: BillingScope, accountId: string) {
    const reset = {
      apiKey: null,
      wabaId: null,
      phoneNumberId: null,
      displayPhoneNumber: null,
      connectionStatus: 'disconnected' as const,
      tokenExpiresAt: null,
    };

    if (scope === 'platform') {
      await prisma.platformWhatsappConfig.upsert({
        where: { id: 'default' },
        create: { id: 'default', provider: 'meta', ...reset },
        update: reset,
      });
    } else {
      await prisma.tenantWhatsappConfig.upsert({
        where: { accountId },
        create: { accountId, provider: 'meta', ...reset },
        update: reset,
      });
    }

    return this.getConnection(scope, accountId);
  }

  /**
   * Returns non-secret Meta connection state for settings UI.
   */
  async getConnection(scope: BillingScope, accountId: string) {
    const row =
      scope === 'platform'
        ? await prisma.platformWhatsappConfig.findUnique({ where: { id: 'default' } })
        : await prisma.tenantWhatsappConfig.findUnique({ where: { accountId } });

    return mapWhatsappConnection(row);
  }
}

function mapWhatsappConnection(row: WhatsappConfigRow | null) {
  return {
    provider: row?.provider ?? 'evolution',
    connectionStatus: row?.connectionStatus ?? 'disconnected',
    wabaId: row?.wabaId ?? null,
    phoneNumberId: row?.phoneNumberId ?? null,
    displayPhoneNumber: row?.displayPhoneNumber ?? null,
    tokenConfigured: Boolean(row?.apiKey),
    tokenExpiresAt: row?.tokenExpiresAt?.toISOString() ?? null,
    instanceUrl: row?.instanceUrl ?? null,
  };
}
