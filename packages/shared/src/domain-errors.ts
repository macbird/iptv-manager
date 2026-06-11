import { API_ERROR_CODES } from './api-error-codes';

/**
 * Raised when a disabled payment provider is used in configuration or routing.
 */
export class PaymentProviderDisabledError extends Error {
  readonly code = API_ERROR_CODES.PAYMENT_PROVIDER_DISABLED;

  constructor(readonly provider: string) {
    super(
      `O provedor de pagamento "${provider}" não está disponível. No momento, use apenas Mercado Pago.`,
    );
    this.name = 'PaymentProviderDisabledError';
  }
}
