import { describe, expect, it } from 'vitest';
import {
  isValidBrazilPhoneE164,
  normalizePhoneE164,
  optionalPhoneE164Schema,
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

describe('optionalPhoneE164Schema', () => {
  it('testOptionalPhoneE164Schema_whenEmpty_shouldBeUndefined', () => {
    expect(optionalPhoneE164Schema.parse('')).toBeUndefined();
    expect(optionalPhoneE164Schema.parse(undefined)).toBeUndefined();
  });
});
