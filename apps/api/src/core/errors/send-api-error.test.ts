import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { API_ERROR_CODES } from '@client-manager/shared';
import { sendApiError, sendNotFound, sendValidationError } from './send-api-error';
import { PaymentProviderDisabledError } from '@client-manager/shared';

function mockReply() {
  const reply = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(body: unknown) {
      this.body = body;
      return this;
    },
  };
  return reply;
}

describe('sendApiError helpers', () => {
  it('testSendApiError_whenDisabledProvider_shouldReturnStandardBody', () => {
    const reply = mockReply();
    sendApiError(reply as never, new PaymentProviderDisabledError('asaas'));

    expect(reply.statusCode).toBe(400);
    expect(reply.body).toMatchObject({
      code: API_ERROR_CODES.PAYMENT_PROVIDER_DISABLED,
      details: { provider: 'asaas' },
    });
  });

  it('testSendValidationError_shouldReturnValidationCode', () => {
    const reply = mockReply();
    const error = new ZodError([
      { code: 'custom', message: 'Campo inválido', path: ['slug'] },
    ]);
    sendValidationError(reply as never, error);

    expect(reply.statusCode).toBe(400);
    expect(reply.body).toMatchObject({
      message: 'Campo inválido',
      code: API_ERROR_CODES.VALIDATION_ERROR,
    });
  });

  it('testSendNotFound_shouldReturnNotFoundCode', () => {
    const reply = mockReply();
    sendNotFound(reply as never, 'Fatura não encontrada');

    expect(reply.statusCode).toBe(404);
    expect(reply.body).toEqual({
      message: 'Fatura não encontrada',
      code: API_ERROR_CODES.NOT_FOUND,
    });
  });
});
