import { describe, expect, it } from 'vitest';
import {
  buildMercadoPagoWebhookUrl,
  extractMercadoPagoPaymentId,
} from './payment-webhook.util';

const SAMPLE_TENANT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

describe('buildMercadoPagoWebhookUrl', () => {
  it('testBuildMercadoPagoWebhookUrl_whenTenantIdProvided_shouldReturnPublicPath', () => {
    const url = buildMercadoPagoWebhookUrl(SAMPLE_TENANT_ID, {
      baseUrl: 'https://api.example.com',
    });

    expect(url).toBe(
      `https://api.example.com/api/webhooks/payment/${SAMPLE_TENANT_ID}/mercadopago`,
    );
  });

  it('testBuildMercadoPagoWebhookUrl_whenTokenProvided_shouldAppendQueryParam', () => {
    const url = buildMercadoPagoWebhookUrl(SAMPLE_TENANT_ID, {
      baseUrl: 'https://api.example.com',
      webhookToken: 'secret-token',
    });

    expect(url).toBe(
      `https://api.example.com/api/webhooks/payment/${SAMPLE_TENANT_ID}/mercadopago?token=secret-token`,
    );
  });
});

describe('extractMercadoPagoPaymentId', () => {
  it('testExtractMercadoPagoPaymentId_whenJsonBody_shouldReadDataId', () => {
    const id = extractMercadoPagoPaymentId(
      { type: 'payment', data: { id: 'PAY01KT8DXBEYDDHKMZH50J57MS3W' } },
      {},
    );

    expect(id).toBe('PAY01KT8DXBEYDDHKMZH50J57MS3W');
  });

  it('testExtractMercadoPagoPaymentId_whenLegacyQuery_shouldReadTopicPayment', () => {
    const id = extractMercadoPagoPaymentId(null, {
      topic: 'payment',
      id: '123456789',
    });

    expect(id).toBe('123456789');
  });

  it('testExtractMercadoPagoPaymentId_whenDataIdQuery_shouldReadTypePayment', () => {
    const id = extractMercadoPagoPaymentId(null, {
      type: 'payment',
      'data.id': '161847961761',
    });

    expect(id).toBe('161847961761');
  });
});
