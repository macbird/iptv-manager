import { describe, expect, it } from 'vitest';
import { CustomerStatus } from './enums';
import {
  resolveAccountListRowAccent,
  resolveCustomerListRowAccent,
  resolveEntityLifecycleAccent,
  resolveInvoiceListRowAccent,
  resolveServerListRowAccent,
} from './list-row-accent';

describe('resolveEntityLifecycleAccent', () => {
  it('testResolveEntityLifecycleAccent_whenInactive_shouldReturnMuted', () => {
    expect(resolveEntityLifecycleAccent('inactive')).toBe('muted');
  });

  it('testResolveEntityLifecycleAccent_whenActive_shouldReturnNone', () => {
    expect(resolveEntityLifecycleAccent('active')).toBe('none');
  });
});

describe('resolveCustomerListRowAccent', () => {
  it('testResolveCustomerListRowAccent_whenInactive_shouldReturnMuted', () => {
    expect(
      resolveCustomerListRowAccent({
        status: CustomerStatus.INACTIVE,
        expiresAt: '2020-01-01',
      }),
    ).toBe('muted');
  });

  it('testResolveCustomerListRowAccent_whenExpiredActive_shouldReturnDanger', () => {
    expect(
      resolveCustomerListRowAccent({
        status: CustomerStatus.ACTIVE,
        expiresAt: '2020-01-01',
      }),
    ).toBe('danger');
  });

  it('testResolveCustomerListRowAccent_whenActiveAndValid_shouldReturnNone', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(
      resolveCustomerListRowAccent({
        status: CustomerStatus.ACTIVE,
        expiresAt: future.toISOString(),
      }),
    ).toBe('none');
  });
});

describe('resolveInvoiceListRowAccent', () => {
  it('testResolveInvoiceListRowAccent_whenCanceled_shouldReturnMuted', () => {
    expect(
      resolveInvoiceListRowAccent({ status: 'canceled', dueDate: '2020-01-01' }),
    ).toBe('muted');
  });

  it('testResolveInvoiceListRowAccent_whenOpenAndPastDue_shouldReturnDanger', () => {
    expect(
      resolveInvoiceListRowAccent({ status: 'open', dueDate: '2020-01-01' }),
    ).toBe('danger');
  });
});

describe('resolveServerListRowAccent', () => {
  it('testResolveServerListRowAccent_whenInactive_shouldReturnMuted', () => {
    expect(resolveServerListRowAccent('inactive')).toBe('muted');
  });

  it('testResolveServerListRowAccent_whenMaintenance_shouldReturnWarning', () => {
    expect(resolveServerListRowAccent('maintenance')).toBe('warning');
  });

  it('testResolveServerListRowAccent_whenFull_shouldReturnCaution', () => {
    expect(resolveServerListRowAccent('full')).toBe('caution');
  });

  it('testResolveServerListRowAccent_whenActive_shouldReturnNone', () => {
    expect(resolveServerListRowAccent('active')).toBe('none');
  });
});

describe('resolveAccountListRowAccent', () => {
  it('testResolveAccountListRowAccent_whenInactive_shouldReturnMuted', () => {
    expect(resolveAccountListRowAccent({ status: 'inactive' })).toBe('muted');
  });

  it('testResolveAccountListRowAccent_whenActiveAndOverdue_shouldReturnDanger', () => {
    expect(
      resolveAccountListRowAccent({ status: 'active', nextDueDate: '2020-01-01' }),
    ).toBe('danger');
  });
});
