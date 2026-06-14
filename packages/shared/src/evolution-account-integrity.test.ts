import { describe, expect, it } from 'vitest';
import {
  detectEvolutionInstanceAnomalies,
  isEvolutionSessionStale,
  resolveEvolutionIntegrityStatus,
} from './evolution-account-integrity';

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

  it('testResolveEvolutionIntegrityStatus_whenRemoteHasDisconnectionReason_shouldReturnStaleSession', () => {
    expect(
      resolveEvolutionIntegrityStatus({
        evolutionConfigured: true,
        instanceName: 'torotv',
        dbConfigured: true,
        remote: {
          connectionStatus: 'open',
          number: null,
          ownerJid: '5535999516263@s.whatsapp.net',
          disconnectionReasonCode: 401,
          disconnectionAt: '2026-06-14T18:08:25.549Z',
        },
        remoteCheckFailed: false,
      }),
    ).toBe('stale_session');
  });
});

describe('isEvolutionSessionStale', () => {
  it('testIsEvolutionSessionStale_whenDisconnectionReasonPresent_shouldReturnTrue', () => {
    expect(
      isEvolutionSessionStale({
        connectionStatus: 'open',
        number: null,
        ownerJid: '5535999516263@s.whatsapp.net',
        disconnectionReasonCode: 401,
      }),
    ).toBe(true);
  });
});

describe('detectEvolutionInstanceAnomalies', () => {
  it('testDetectEvolutionInstanceAnomalies_whenDbDisconnectedAndRemoteOpen_shouldFlagMismatch', () => {
    const anomalies = detectEvolutionInstanceAnomalies({
      dbConnectionStatus: 'disconnected',
      remote: {
        connectionStatus: 'open',
        number: '5535999841521',
        ownerJid: '5535999841521@s.whatsapp.net',
      },
    });

    expect(anomalies.some((item) => item.code === 'db_remote_status_mismatch')).toBe(true);
  });

  it('testDetectEvolutionInstanceAnomalies_whenStaleSession_shouldFlagCriticalAnomalies', () => {
    const anomalies = detectEvolutionInstanceAnomalies({
      dbConnectionStatus: 'disconnected',
      remote: {
        connectionStatus: 'open',
        number: null,
        ownerJid: '5535999516263@s.whatsapp.net',
        disconnectionReasonCode: 401,
        disconnectionAt: '2026-06-14T18:08:25.549Z',
      },
    });

    expect(anomalies.some((item) => item.code === 'stale_session')).toBe(true);
    expect(anomalies.some((item) => item.code === 'reset_likely_blocked')).toBe(true);
  });
});
