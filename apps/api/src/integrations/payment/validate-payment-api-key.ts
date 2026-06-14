import type { PaymentProviderType } from '@prisma/client';
import { ApiValidationError } from '@client-manager/shared';

/** Mercado Pago Public Key pattern (UUID) — must not be used as Access Token. */
const MP_PUBLIC_KEY_PATTERN =
  /^APP_USR-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates PSP API keys before persisting tenant/platform credentials.
 */
export function validatePaymentApiKey(provider: PaymentProviderType, apiKey: string): string {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new ApiValidationError('Informe a API key do provider de pagamento.');
  }

  if (provider === 'mercadopago') {
    if (trimmed.startsWith('TESTUSER')) {
      throw new ApiValidationError(
        'Valor inválido: isso é o usuário de teste (comprador). Copie o Access Token em Developers → Credenciais de produção.',
      );
    }
    if (trimmed.startsWith('TEST-')) {
      throw new ApiValidationError(
        'Token de teste (TEST-...) não é válido aqui. Use o Access Token de produção (APP_USR-...) em Credenciais de produção.',
      );
    }
    if (MP_PUBLIC_KEY_PATTERN.test(trimmed)) {
      throw new ApiValidationError(
        'Isso é a Public Key do Mercado Pago. Use o Access Token (campo abaixo da Public Key, token longo).',
      );
    }
    if (!trimmed.startsWith('APP_USR-')) {
      throw new ApiValidationError(
        'Access Token inválido. Use o token de produção do Mercado Pago (começa com APP_USR-).',
      );
    }
  }

  return trimmed;
}
