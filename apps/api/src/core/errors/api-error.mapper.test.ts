import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import {
  API_ERROR_CODES,
  ApiBusinessError,
  ApiValidationError,
  PaymentProviderDisabledError,
} from '@client-manager/shared';
import { PaymentProviderError } from '../../integrations/payment/payment-provider.errors';
import { InvoiceActionError } from '../../modules/billing/invoice-errors';
import { EvolutionWhatsAppError } from '../../integrations/whatsapp/evolution/evolution-whatsapp.errors';
import { MetaWhatsAppError } from '../../integrations/whatsapp/meta/meta-whatsapp.errors';
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
    const mapped = mapErrorToApiResponse(new PaymentProviderDisabledError('asaas'));
    expect(mapped.statusCode).toBe(400);
    expect(mapped.body.code).toBe(API_ERROR_CODES.PAYMENT_PROVIDER_DISABLED);
    expect(mapped.body.details).toEqual({ provider: 'asaas' });
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

  it('testMapErrorToApiResponse_whenApiBusinessConflict_shouldReturn409', () => {
    const mapped = mapErrorToApiResponse(
      new ApiBusinessError('Identificador duplicado', API_ERROR_CODES.CONFLICT, 409),
    );
    expect(mapped.statusCode).toBe(409);
    expect(mapped.body.code).toBe(API_ERROR_CODES.CONFLICT);
  });

  it('testMapErrorToApiResponse_whenApiValidationError_shouldReturn400', () => {
    const mapped = mapErrorToApiResponse(
      new ApiValidationError('amountCents deve ser um inteiro positivo'),
    );
    expect(mapped.statusCode).toBe(400);
    expect(mapped.body.code).toBe(API_ERROR_CODES.VALIDATION_ERROR);
  });

  it('testMapErrorToApiResponse_whenApiBusinessForbidden_shouldReturn403', () => {
    const mapped = mapErrorToApiResponse(
      new ApiBusinessError('Conta desativada', API_ERROR_CODES.NOT_ALLOWED, 403),
    );
    expect(mapped.statusCode).toBe(403);
    expect(mapped.body.code).toBe(API_ERROR_CODES.NOT_ALLOWED);
  });

  it('testMapErrorToApiResponse_whenPaymentCredentialsMissing_shouldReturn400', () => {
    const mapped = mapErrorToApiResponse(
      new PaymentProviderError(
        'Credencial do Mercado Pago não configurada',
        'mercadopago',
        400,
        API_ERROR_CODES.PAYMENT_CREDENTIALS_MISSING,
      ),
    );
    expect(mapped.statusCode).toBe(400);
    expect(mapped.body.code).toBe(API_ERROR_CODES.PAYMENT_CREDENTIALS_MISSING);
  });

  it('testMapErrorToApiResponse_whenMetaWhatsappError_shouldReturn502', () => {
    const mapped = mapErrorToApiResponse(new MetaWhatsAppError('Falha na API Meta', 'API_ERROR'));
    expect(mapped.statusCode).toBe(502);
    expect(mapped.body.code).toBe(API_ERROR_CODES.WHATSAPP_PROVIDER_ERROR);
  });

  it('testMapErrorToApiResponse_whenPrismaDuplicate_shouldReturn409', () => {
    const error = new Prisma.PrismaClientKnownRequestError('duplicate', {
      code: 'P2002',
      clientVersion: 'test',
    });
    const mapped = mapErrorToApiResponse(error);
    expect(mapped.statusCode).toBe(409);
    expect(mapped.body.code).toBe(API_ERROR_CODES.CONFLICT);
  });

  it('testMapErrorToApiResponse_whenUnknownError_shouldReturnInternalError', () => {
    const mapped = mapErrorToApiResponse(new Error('unexpected'));
    expect(mapped.statusCode).toBe(500);
    expect(mapped.body.code).toBe(API_ERROR_CODES.INTERNAL_ERROR);
  });
});
