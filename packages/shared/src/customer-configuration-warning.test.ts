import { describe, expect, it } from 'vitest';
import {
  buildCustomerConfigurationWarning,
  getCustomerConfigurationWarningDetails,
  getCustomerConfigurationWarningMessage,
  hasCustomerConfigurationWarning,
} from './customer-configuration-warning';

describe('buildCustomerConfigurationWarning', () => {
  it('testBuildCustomerConfigurationWarning_whenInactivePlan_shouldFlagPlan', () => {
    const warning = buildCustomerConfigurationWarning({
      planStatus: 'inactive',
      serverStatuses: ['active'],
    });
    expect(warning.inactivePlan).toBe(true);
    expect(warning.inactiveServerConnection).toBe(false);
  });

  it('testBuildCustomerConfigurationWarning_whenInactiveServer_shouldFlagServer', () => {
    const warning = buildCustomerConfigurationWarning({
      planStatus: 'active',
      serverStatuses: ['active', 'inactive'],
    });
    expect(warning.inactivePlan).toBe(false);
    expect(warning.inactiveServerConnection).toBe(true);
  });
});

describe('getCustomerConfigurationWarningDetails', () => {
  it('testGetCustomerConfigurationWarningDetails_whenInactivePlan_shouldExplainPlan', () => {
    const messages = getCustomerConfigurationWarningDetails({
      plan: { name: 'Família 2 telas', status: 'inactive' },
      connections: [],
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('Família 2 telas');
  });

  it('testGetCustomerConfigurationWarningDetails_whenInactiveServer_shouldExplainServer', () => {
    const messages = getCustomerConfigurationWarningDetails({
      plan: { name: 'Básico', status: 'active' },
      connections: [{ server: { name: 'Brasil SP', status: 'inactive' } }],
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('Brasil SP');
  });
});

describe('getCustomerConfigurationWarningMessage', () => {
  it('testGetCustomerConfigurationWarningMessage_whenBothIssues_shouldJoinMessages', () => {
    const message = getCustomerConfigurationWarningMessage({
      inactivePlan: true,
      inactiveServerConnection: true,
    });
    expect(message).toContain('plano desativado');
    expect(message).toContain('servidor desativado');
  });

  it('testHasCustomerConfigurationWarning_whenNone_shouldReturnFalse', () => {
    expect(
      hasCustomerConfigurationWarning({
        inactivePlan: false,
        inactiveServerConnection: false,
      }),
    ).toBe(false);
  });
});
