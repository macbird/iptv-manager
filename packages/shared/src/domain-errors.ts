import { API_ERROR_CODES, type ApiErrorCode } from './api-error-codes';

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

/**
 * Raised when request or domain input fails business validation.
 */
export class ApiValidationError extends Error {
  readonly code = API_ERROR_CODES.VALIDATION_ERROR;

  constructor(message: string) {
    super(message);
    this.name = 'ApiValidationError';
  }
}

/**
 * Raised for predictable API failures with a stable machine-readable code.
 */
export class ApiBusinessError extends Error {
  constructor(
    message: string,
    readonly code: ApiErrorCode,
    readonly statusCode = 400,
  ) {
    super(message);
    this.name = 'ApiBusinessError';
  }
}
