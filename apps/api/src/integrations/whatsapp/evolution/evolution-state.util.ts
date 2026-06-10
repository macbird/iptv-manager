import type { WhatsAppConnectionStatus } from '@prisma/client';

export interface EvolutionSessionSignals {
  ownerJid?: string | null;
  profileName?: string | null;
  number?: string | null;
}

/**
 * Maps Evolution remote connection state to persisted tenant status.
 * "open" alone is not trusted — Evolution often reports open before WhatsApp is paired.
 */
export function mapEvolutionState(
  state: string,
  fallback?: string | null,
  session?: EvolutionSessionSignals | null,
): WhatsAppConnectionStatus {
  const raw = state === 'unknown' && fallback ? fallback : state;
  const value = raw.toLowerCase();

  if (value === 'close' || value === 'closed' || value === 'disconnected') {
    return 'disconnected';
  }

  if (
    value === 'connecting' ||
    value === 'pairing' ||
    value === 'qrcode' ||
    value === 'pending'
  ) {
    return 'pending';
  }

  if (value === 'open' || value === 'connected') {
    return hasEvolutionSessionProof(session) ? 'connected' : 'pending';
  }

  return 'disconnected';
}

/**
 * Returns true when Evolution metadata indicates a paired WhatsApp session.
 */
export function hasEvolutionSessionProof(session?: EvolutionSessionSignals | null): boolean {
  if (!session) {
    return false;
  }

  return Boolean(
    session.ownerJid?.trim() || session.profileName?.trim() || session.number?.trim(),
  );
}

/**
 * Builds a display phone number from Evolution instance metadata.
 */
export function formatEvolutionDisplayPhone(
  number: string | null | undefined,
  ownerJid: string | null | undefined,
): string | null {
  if (number) {
    return number.startsWith('+') ? number : `+${number}`;
  }

  if (!ownerJid) {
    return null;
  }

  const digits = ownerJid.split('@')[0]?.replace(/\D/g, '');
  return digits ? `+${digits}` : null;
}
