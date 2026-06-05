import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyMercadoPagoWebhookSignature } from './mercadopago-webhook-signature.util';

const SECRET = '808e6fde-test-secret';

function buildSignature(dataId: string, requestId: string, ts: string, secret: string): string {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac('sha256', secret).update(manifest).digest('hex');
  return `ts=${ts},v1=${v1}`;
}

describe('verifyMercadoPagoWebhookSignature', () => {
  it('testVerifySignature_whenSecretNotConfigured_shouldSkipValidation', () => {
    const result = verifyMercadoPagoWebhookSignature({
      secret: '',
      xSignature: undefined,
      xRequestId: undefined,
      dataId: null,
    });

    expect(result.skipped).toBe(true);
    expect(result.valid).toBe(true);
  });

  it('testVerifySignature_whenValidHeader_shouldReturnValid', () => {
    const dataId = '161847961761';
    const requestId = 'req-123';
    const ts = String(Math.floor(Date.now() / 1000));
    const xSignature = buildSignature(dataId, requestId, ts, SECRET);

    const result = verifyMercadoPagoWebhookSignature({
      secret: SECRET,
      xSignature,
      xRequestId: requestId,
      dataId,
    });

    expect(result.valid).toBe(true);
    expect(result.skipped).toBe(false);
  });

  it('testVerifySignature_whenSignatureMismatch_shouldReturnInvalid', () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const result = verifyMercadoPagoWebhookSignature({
      secret: SECRET,
      xSignature: `ts=${ts},v1=deadbeef0000000000000000000000000000000000000000000000000000`,
      xRequestId: 'req-123',
      dataId: '161847961761',
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('signature_mismatch');
  });
});
