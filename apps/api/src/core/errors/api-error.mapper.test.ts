import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { API_ERROR_CODES } from '@client-manager/shared';
import { PaymentProviderError } from '../../integrations/payment/payment-provider.errors';
import { InvoiceActionError } from '../../modules/billing/invoice-errors';
import { EvolutionWhatsAppError } from '../../integrations/whatsapp/evolution/evolution-whatsapp.errors';
import { mapErrorToApiResponse } from './api-error.mapper';

describe('mapErrorToApiResponse', () => {
  it('testMapErrorToApiResponse_whenZodError_shouldReturnValidationError', () => {
    const error = new ZodError([
      { code: 'custom', message: 'Identificador inválido', path: ['slug'] },
    ]);

    const mapped = mapErrorToApiResponse(error);
    expect(mapped.statusCode).toBe(400);
    expect(mapped.body.code).toBe(API_ERROR_CODES.VALIDATION_ERROR);
    expect(mapped.body.message).toBe('Identificador inválido');
  });

  it('testMapErrorToApiResponse_whenPaymentProviderDisabled_shouldReturn400', () => {
    const error = new PaymentProviderError(
      'Provider desabilitado',
      'asaas',
      400,
      API_ERROR_CODES.PAYMENT_PROVIDER_DISABLED,
    );

    const mapped = mapErrorToApiResponse(error);
    expect(mapped.statusCode).toBe(400);
    expect(mapped.body.code).toBe(API_ERROR_CODES.PAYMENT_PROVIDER_DISABLED);
  });

  it('testMapErrorToApiResponse_whenInvoiceNotAllowed_shouldReturn400', () => {
    const mapped = mapErrorToApiResponse(new InvoiceActionError('Fatura já está paga', 'NOT_ALLOWED'));
    expect(mapped.statusCode).toBe(400);
    expect(mapped.body.code).toBe('NOT_ALLOWED');
  });

  it('testMapErrorToApiResponse_whenWhatsappNotConnected_shouldReturn409', () => {
    const mapped = mapErrorToApiResponse(
      new EvolutionWhatsAppError('WhatsApp não conectado', 'NOT_CONNECTED'),
    );
    expect(mapped.statusCode).toBe(409);
    expect(mapped.body.code).toBe(API_ERROR_CODES.WHATSAPP_NOT_CONNECTED);
  });
});
