import type { BillingScope, PaymentProviderType } from '@prisma/client';
import { API_ERROR_CODES, isEnabledPaymentProvider } from '@client-manager/shared';
import { prisma } from '../../core/database';
import { safeDecryptCredential } from '../../core/crypto/credential-crypto';
import type { PaymentProvider } from './payment-provider.interface';
import { MercadoPagoPaymentProvider } from './mercadopago.provider';
import { PaymentProviderError } from './payment-provider.errors';
import { PaymentRouterService } from './payment-router.service';

const paymentRouter = new PaymentRouterService();

/**
 * Resolves PSP credentials and instantiates payment adapters.
 *
 * @author João Paulo da Silva
 * @since 4.9.0
 * @creationDate 04/06/2026
 * Copyright (c) 2026 NTT DATA Brasil Consultoria de Negócio e Tecnologia da Informação Ltda.
 * Todos os direitos reservados.
 */
export class PaymentProviderFactory {
  /**
   * Resolves which PSP to use for an invoice amount and scope.
   */
  async resolveProvider(
    scope: BillingScope,
    accountId: string,
    amountCents: number,
  ): Promise<PaymentProviderType> {
    if (scope === 'platform') {
      const config = await prisma.platformPaymentConfig.findUnique({
        where: { id: 'default' },
      });
      const provider = config?.provider ?? 'mercadopago';
      return isEnabledPaymentProvider(provider) ? provider : 'mercadopago';
    }
    return paymentRouter.resolveForTenant(accountId, amountCents);
  }

  /**
   * Loads the API key for the given scope, account and provider.
   */
  async getApiKey(
    scope: BillingScope,
    accountId: string,
    provider: PaymentProviderType,
  ): Promise<string | null> {
    if (scope === 'platform') {
      const config = await prisma.platformPaymentConfig.findUnique({
        where: { id: 'default' },
      });
      if (!config?.apiKey || config.provider !== provider) {
        return null;
      }
      return resolveStoredSecret(config.apiKey);
    }

    const credential = await prisma.tenantPaymentCredential.findUnique({
      where: {
        accountId_provider: { accountId, provider },
      },
    });

    if (!credential?.active || !credential.apiKey) {
      return null;
    }

    return resolveStoredSecret(credential.apiKey);
  }

  /**
   * Returns a configured payment adapter for the invoice context.
   */
  async getProvider(
    scope: BillingScope,
    accountId: string,
    provider: PaymentProviderType,
  ): Promise<PaymentProvider> {
    if (!isEnabledPaymentProvider(provider)) {
      throw new PaymentProviderError(
        `O provedor "${provider}" não está disponível. Use Mercado Pago.`,
        provider,
        400,
        API_ERROR_CODES.PAYMENT_PROVIDER_DISABLED,
      );
    }

    const apiKey = await this.getApiKey(scope, accountId, provider);
    if (!apiKey) {
      throw new PaymentProviderError(
        `Credencial do Mercado Pago não configurada. Configure em Configurações.`,
        provider,
        400,
        API_ERROR_CODES.PAYMENT_CREDENTIALS_MISSING,
      );
    }

    return new MercadoPagoPaymentProvider(apiKey);
  }
}

function resolveStoredSecret(value: string): string {
  const decrypted = safeDecryptCredential(value);
  return decrypted || value;
}
