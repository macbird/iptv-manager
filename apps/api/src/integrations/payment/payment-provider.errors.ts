/** Errors raised by payment provider adapters and generation flow. */

import { API_ERROR_CODES } from '@client-manager/shared';

export class PaymentProviderError extends Error {
  readonly code: string;

  constructor(
    message: string,
    readonly provider?: string,
    readonly statusCode?: number,
    code: string = API_ERROR_CODES.PAYMENT_PROVIDER_ERROR,
  ) {
    super(message);
    this.name = 'PaymentProviderError';
    this.code = code;
  }
}
