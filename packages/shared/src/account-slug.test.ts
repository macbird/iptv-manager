import { describe, expect, it } from 'vitest';
import { accountSlugSchema, normalizeAccountSlug } from './account-slug';

describe('accountSlugSchema', () => {
  it('testParse_whenValidSlug_shouldAccept', () => {
    expect(accountSlugSchema.parse('torotv')).toBe('torotv');
    expect(accountSlugSchema.parse('revenda-master-01')).toBe('revenda-master-01');
  });

  it('testParse_whenUppercase_shouldNormalizeToLowercase', () => {
    expect(accountSlugSchema.parse('ToroTV')).toBe('torotv');
  });

  it('testParse_whenContainsSpace_shouldReject', () => {
    expect(() => accountSlugSchema.parse('Toro TV')).toThrow();
    expect(() => accountSlugSchema.parse('toro tv')).toThrow();
  });

  it('testParse_whenEmpty_shouldReject', () => {
    expect(() => accountSlugSchema.parse('')).toThrow(/obrigatório/i);
  });

  it('testParse_whenSpecialChars_shouldReject', () => {
    expect(() => accountSlugSchema.parse('toro_tv')).toThrow();
    expect(() => accountSlugSchema.parse('toro.tv')).toThrow();
  });
});

describe('normalizeAccountSlug', () => {
  it('testNormalize_whenPadded_shouldTrimAndLowercase', () => {
    expect(normalizeAccountSlug('  ToroTV  ')).toBe('torotv');
  });
});
