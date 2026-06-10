import { describe, expect, it } from 'vitest';
import { formatEvolutionDisplayPhone, mapEvolutionState } from './evolution-state.util';

describe('mapEvolutionState', () => {
  it('maps open to connected when session proof exists', () => {
    expect(mapEvolutionState('open', null, { ownerJid: '5535@s.whatsapp.net' })).toBe(
      'connected',
    );
  });

  it('maps open to pending when session proof is missing', () => {
    expect(mapEvolutionState('open')).toBe('pending');
  });

  it('maps open to pending when ownerJid is null', () => {
    expect(mapEvolutionState('open', 'open', { ownerJid: null, number: null })).toBe('pending');
  });

  it('maps connecting to pending', () => {
    expect(mapEvolutionState('connecting')).toBe('pending');
  });

  it('maps close to disconnected', () => {
    expect(mapEvolutionState('close')).toBe('disconnected');
  });

  it('uses fallback when state is unknown', () => {
    expect(mapEvolutionState('unknown', 'close')).toBe('disconnected');
  });
});

describe('formatEvolutionDisplayPhone', () => {
  it('prefixes plus when number has no plus', () => {
    expect(formatEvolutionDisplayPhone('5535999516233', null)).toBe('+5535999516233');
  });

  it('extracts digits from owner jid', () => {
    expect(formatEvolutionDisplayPhone(null, '5535999516233@s.whatsapp.net')).toBe(
      '+5535999516233',
    );
  });
});
