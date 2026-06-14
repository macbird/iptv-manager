import { describe, expect, it } from 'vitest';
import { resolveEvolutionIntegrityStatus } from './evolution-account-integrity';

describe('resolveEvolutionIntegrityStatus', () => {
  it('testResolveEvolutionIntegrityStatus_whenEvolutionNotConfigured_shouldReturnNotConfigured', () => {
    expect(
      resolveEvolutionIntegrityStatus({
        evolutionConfigured: false,
        instanceName: 'revenda-a',
        dbConfigured: true,
        remote: null,
        remoteCheckFailed: false,
      }),
    ).toBe('not_configured');
  });

  it('testResolveEvolutionIntegrityStatus_whenDbMissing_shouldReturnMissingDb', () => {
    expect(
      resolveEvolutionIntegrityStatus({
        evolutionConfigured: true,
        instanceName: 'revenda-a',
        dbConfigured: false,
        remote: null,
        remoteCheckFailed: false,
      }),
    ).toBe('missing_db');
  });

  it('testResolveEvolutionIntegrityStatus_whenRemoteMissing_shouldReturnMissingRemote', () => {
    expect(
      resolveEvolutionIntegrityStatus({
        evolutionConfigured: true,
        instanceName: 'revenda-a',
        dbConfigured: true,
        remote: null,
        remoteCheckFailed: false,
      }),
    ).toBe('missing_remote');
  });

  it('testResolveEvolutionIntegrityStatus_whenRemoteOpenWithSession_shouldReturnConnected', () => {
    expect(
      resolveEvolutionIntegrityStatus({
        evolutionConfigured: true,
        instanceName: 'revenda-a',
        dbConfigured: true,
        remote: {
          connectionStatus: 'open',
          number: '5535999841521',
          ownerJid: null,
        },
        remoteCheckFailed: false,
      }),
    ).toBe('connected');
  });

  it('testResolveEvolutionIntegrityStatus_whenRemoteOpenWithoutSession_shouldReturnPending', () => {
    expect(
      resolveEvolutionIntegrityStatus({
        evolutionConfigured: true,
        instanceName: 'revenda-a',
        dbConfigured: true,
        remote: {
          connectionStatus: 'open',
          number: null,
          ownerJid: null,
        },
        remoteCheckFailed: false,
      }),
    ).toBe('pending');
  });
});
