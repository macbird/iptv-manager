import { describe, expect, it } from 'vitest';
import { ApiValidationError } from '@client-manager/shared';
import { validatePaymentApiKey } from './validate-payment-api-key';

describe('validatePaymentApiKey', () => {
  it('testValidatePaymentApiKey_whenMercadoPagoTestUser_shouldRejectWithValidationError', () => {
    expect(() =>
      validatePaymentApiKey('mercadopago', 'TESTUSER8751396418337136189'),
    ).toThrow(ApiValidationError);
    expect(() =>
      validatePaymentApiKey('mercadopago', 'TESTUSER8751396418337136189'),
    ).toThrow(/usuário de teste/i);
  });

  it('testValidatePaymentApiKey_whenMercadoPagoInvalidToken_shouldRejectWithValidationError', () => {
    expect(() => validatePaymentApiKey('mercadopago', 'invalid')).toThrow(ApiValidationError);
    expect(() => validatePaymentApiKey('mercadopago', 'invalid')).toThrow(
      /Access Token inválido/i,
    );
  });

  it('testValidatePaymentApiKey_whenMercadoPagoEmpty_shouldRejectWithValidationError', () => {
    expect(() => validatePaymentApiKey('mercadopago', '   ')).toThrow(ApiValidationError);
    expect(() => validatePaymentApiKey('mercadopago', '   ')).toThrow(/Informe a API key/i);
  });

  it('testValidatePaymentApiKey_whenMercadoPago PublicKey_shouldRejectWithValidationError', () => {
    expect(() =>
      validatePaymentApiKey('mercadopago', 'APP_USR-89bce7f7-83af-4059-9050-9f477ae3c277'),
    ).toThrow(ApiValidationError);
    expect(() =>
      validatePaymentApiKey('mercadopago', 'APP_USR-89bce7f7-83af-4059-9050-9f477ae3c277'),
    ).toThrow(/ Public Key/i);
  });

  it('testValidatePaymentApiKey_whenMercadoPagoTestAccessToken_shouldAccept', () => {
    const token =
      'APP_USR-7287035758275479-060400-4cd0f523246696d4ac22816453fa1922-3460264486';
    expect(validatePaymentApiKey('mercadopago', token)).toBe(token);
  });

  it('testValidatePaymentApiKey_whenMercadoPagoTestToken_shouldRejectWithValidationError', () => {
    const token = `TEST-${'1'.repeat(80)}`;
    expect(() => validatePaymentApiKey('mercadopago', token)).toThrow(ApiValidationError);
    expect(() => validatePaymentApiKey('mercadopago', token)).toThrow(/Token de teste/i);
  });
});
