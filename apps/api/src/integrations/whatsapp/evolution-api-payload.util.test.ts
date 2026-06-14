import { describe, expect, it } from 'vitest';
import {
  normalizeEvolutionInstanceItem,
  normalizeEvolutionPairingCode,
  parseEvolutionConnectPayload,
  readEvolutionRemoteState,
  unwrapEvolutionConnectPayload,
  unwrapEvolutionInstanceList,
} from './evolution-api-payload.util';

describe('normalizeEvolutionInstanceItem', () => {
  it('should parse flat v1 list items', () => {
    const summary = normalizeEvolutionInstanceItem({
      name: 'toro-tv',
      connectionStatus: 'close',
      ownerJid: '5531999999999@s.whatsapp.net',
      number: '5531999999999',
    });

    expect(summary).toEqual({
      instanceName: 'toro-tv',
      connectionStatus: 'close',
      number: '5531999999999',
      ownerJid: '5531999999999@s.whatsapp.net',
    });
  });

  it('should parse nested v2 list items', () => {
    const summary = normalizeEvolutionInstanceItem({
      instance: {
        instanceName: 'tenant-a',
        status: 'open',
        owner: '5531888888888@s.whatsapp.net',
      },
    });

    expect(summary?.instanceName).toBe('tenant-a');
    expect(summary?.connectionStatus).toBe('open');
    expect(summary?.ownerJid).toBe('5531888888888@s.whatsapp.net');
    expect(summary?.number).toBe('5531888888888');
  });

  it('should parse object connectionStatus', () => {
    const summary = normalizeEvolutionInstanceItem({
      instanceName: 'tenant-b',
      connectionStatus: { state: 'connecting' },
    });

    expect(summary?.connectionStatus).toBe('connecting');
  });
});

describe('parseEvolutionConnectPayload', () => {
  it('should read nested qrcode base64', () => {
    const parsed = parseEvolutionConnectPayload({
      instance: { state: 'connecting' },
      qrcode: { base64: 'data:image/png;base64,abc', count: 1 },
    });

    expect(parsed.state).toBe('connecting');
    expect(parsed.qrCodeBase64).toBe('data:image/png;base64,abc');
  });

  it('should read flat v2 pairing fields', () => {
    const parsed = parseEvolutionConnectPayload({
      pairingCode: 'WZYEH1YY',
      count: 1,
    });

    expect(parsed.pairingCode).toBe('WZYEH1YY');
    expect(parsed.qrCodeRaw).toBeUndefined();
    expect(parsed.qrCodeBase64).toBeUndefined();
  });

  it('should normalize dashed pairing codes', () => {
    const parsed = parseEvolutionConnectPayload({
      pairingCode: 'abcd-efgh',
      count: 1,
    });

    expect(parsed.pairingCode).toBe('ABCDEFGH');
  });

  it('should unwrap array connect payloads', () => {
    const parsed = parseEvolutionConnectPayload([
      {
        pairingCode: 'FNPG5AYK',
        count: 1,
      },
    ]);

    expect(parsed.pairingCode).toBe('FNPG5AYK');
  });

  it('should read nested qrcode pairing code', () => {
    const parsed = parseEvolutionConnectPayload({
      qrcode: {
        pairingCode: 'ABCD-1234',
        count: 1,
      },
    });

    expect(parsed.pairingCode).toBe('ABCD1234');
  });

  it('should ignore qr raw code as pairing code', () => {
    expect(normalizeEvolutionPairingCode('2@pairing-token')).toBeUndefined();
  });

  it('should expose raw QR code payload when base64 is missing', () => {
    const parsed = parseEvolutionConnectPayload({
      code: '2@pairing-token',
      count: 1,
    });

    expect(parsed.qrCodeRaw).toBe('2@pairing-token');
  });
});

describe('unwrapEvolutionConnectPayload', () => {
  it('should unwrap response object wrapper', () => {
    expect(
      unwrapEvolutionConnectPayload({
        response: { pairingCode: 'WZYEH1YY' },
      }).pairingCode,
    ).toBe('WZYEH1YY');
  });
});

describe('readEvolutionRemoteState', () => {
  it('should read nested instance state', () => {
    expect(
      readEvolutionRemoteState({
        instance: { instanceName: 'x', state: 'open' },
      }),
    ).toBe('open');
  });
});

describe('unwrapEvolutionInstanceList', () => {
  it('should unwrap response array wrapper', () => {
    expect(
      unwrapEvolutionInstanceList({
        response: [{ instanceName: 'a' }],
      }),
    ).toHaveLength(1);
  });
});
