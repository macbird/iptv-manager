import { describe, it, expect } from 'vitest';
import { extendExpiryFromDate, resolveRenewalBaseDate } from './activation-expiry.util';

describe('resolveRenewalBaseDate', () => {
  it('testResolveRenewalBaseDate_whenExpiryIsFuture_shouldUseExpiryDate', () => {
    const activationDay = new Date('2026-06-02T15:30:00.000Z');
    const futureExpiry = new Date('2026-07-10T08:00:00.000Z');

    const result = resolveRenewalBaseDate(futureExpiry, activationDay);

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(6);
    expect(result.getDate()).toBe(10);
  });

  it('testResolveRenewalBaseDate_whenExpiryIsPastOrToday_shouldUseActivationDate', () => {
    const activationDay = new Date('2026-06-02T15:30:00.000Z');
    const pastExpiry = new Date('2026-05-01T08:00:00.000Z');

    const result = resolveRenewalBaseDate(pastExpiry, activationDay);

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(2);
  });

  it('testResolveRenewalBaseDate_whenExpiryIsNull_shouldUseActivationDate', () => {
    const activationDay = new Date('2026-06-02T12:00:00.000Z');

    const result = resolveRenewalBaseDate(null, activationDay);

    expect(result.getDate()).toBe(2);
  });
});

describe('extendExpiryFromDate', () => {
  it('testExtendExpiryFromDate_whenMonthly_shouldAddOneMonth', () => {
    const base = new Date('2026-06-02T12:00:00.000Z');
    const result = extendExpiryFromDate(base, 'monthly');
    expect(result.getMonth()).toBe(6);
    expect(result.getDate()).toBe(2);
  });

  it('testExtendExpiryFromDate_whenYearly_shouldAddOneYear', () => {
    const base = new Date('2026-06-02T12:00:00.000Z');
    const result = extendExpiryFromDate(base, 'yearly');
    expect(result.getFullYear()).toBe(2027);
  });
});
