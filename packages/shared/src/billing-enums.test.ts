import { describe, expect, it } from 'vitest';
import { assertEnabledPaymentProvider, isEnabledPaymentProvider } from './billing-enums';
import { PaymentProviderDisabledError } from './domain-errors';

describe('isEnabledPaymentProvider', () => {
  it('testIsEnabledPaymentProvider_whenMercadoPago_shouldReturnTrue', () => {
    expect(isEnabledPaymentProvider('mercadopago')).toBe(true);
  });

  it('testIsEnabledPaymentProvider_whenAsaas_shouldReturnFalse', () => {
    expect(isEnabledPaymentProvider('asaas')).toBe(false);
  });
});

describe('assertEnabledPaymentProvider', () => {
  it('testAssertEnabledPaymentProvider_whenAsaas_shouldThrowDisabledError', () => {
    expect(() => assertEnabledPaymentProvider('asaas')).toThrow(PaymentProviderDisabledError);
  });

  it('testAssertEnabledPaymentProvider_whenMercadoPago_shouldNotThrow', () => {
    expect(() => assertEnabledPaymentProvider('mercadopago')).not.toThrow();
  });
});
