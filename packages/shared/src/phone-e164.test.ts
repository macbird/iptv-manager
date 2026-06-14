import { describe, expect, it } from 'vitest';
import {
  buildBrazilPairingPhoneCandidates,
  formatBrazilPhoneForDisplay,
  isValidBrazilPhoneE164,
  normalizePhoneE164,
  optionalPhoneE164Schema,
  orderBrazilPairingPhoneCandidates,
  requiredPhoneE164Schema,
} from './phone-e164';

describe('normalizePhoneE164', () => {
  it('testNormalizePhoneE164_whenMobileWithoutCountryCode_shouldPrefix55', () => {
    expect(normalizePhoneE164('35999841521')).toBe('5535999841521');
  });

  it('testNormalizePhoneE164_whenAlreadyE164_shouldKeepDigits', () => {
    expect(normalizePhoneE164('+55 (35) 99984-1521')).toBe('5535999841521');
  });
});

describe('requiredPhoneE164Schema', () => {
  it('testRequiredPhoneE164Schema_whenValidInput_shouldNormalize', () => {
    const parsed = requiredPhoneE164Schema.parse('35999841521');
    expect(parsed).toBe('5535999841521');
    expect(isValidBrazilPhoneE164(parsed)).toBe(true);
  });

  it('testRequiredPhoneE164Schema_whenTooShort_shouldReject', () => {
    expect(() => requiredPhoneE164Schema.parse('123')).toThrow();
  });
});

describe('buildBrazilPairingPhoneCandidates', () => {
  it('testBuildBrazilPairingPhoneCandidates_whenMobileWithNine_shouldIncludeWithoutNine', () => {
    expect(buildBrazilPairingPhoneCandidates('5535999841521')).toEqual([
      '5535999841521',
      '553599841521',
    ]);
  });

  it('testBuildBrazilPairingPhoneCandidates_whenMobileWithoutNine_shouldIncludeWithNine', () => {
    expect(buildBrazilPairingPhoneCandidates('553599841521')).toEqual([
      '553599841521',
      '5535999841521',
    ]);
  });
});

describe('orderBrazilPairingPhoneCandidates', () => {
  it('testOrderBrazilPairingPhoneCandidates_whenTenDigitMobile_shouldTryWithNineFirst', () => {
    expect(orderBrazilPairingPhoneCandidates('553599841521')).toEqual([
      '5535999841521',
      '553599841521',
    ]);
  });
});

describe('formatBrazilPhoneForDisplay', () => {
  it('testFormatBrazilPhoneForDisplay_whenMobile_shouldFormatNationalNumber', () => {
    expect(formatBrazilPhoneForDisplay('5535999841521')).toBe('+55 (35) 99984-1521');
  });
});

describe('optionalPhoneE164Schema', () => {
  it('testOptionalPhoneE164Schema_whenEmpty_shouldBeUndefined', () => {
    expect(optionalPhoneE164Schema.parse('')).toBeUndefined();
    expect(optionalPhoneE164Schema.parse(undefined)).toBeUndefined();
  });
});
