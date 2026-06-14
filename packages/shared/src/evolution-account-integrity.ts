/**
 * Evolution WhatsApp instance integrity for admin account listings.
 */

export type EvolutionInstanceIntegrityStatus =
  | 'not_configured'
  | 'missing_db'
  | 'missing_remote'
  | 'disconnected'
  | 'pending'
  | 'connected'
  | 'unknown';

export interface AccountEvolutionIntegrity {
  status: EvolutionInstanceIntegrityStatus;
  instanceName: string | null;
  displayPhoneNumber: string | null;
}

export const EVOLUTION_INTEGRITY_LABELS: Record<
  EvolutionInstanceIntegrityStatus,
  { label: string; title: string }
> = {
  not_configured: {
    label: 'Evo off',
    title: 'Evolution API não configurada no servidor (EVOLUTION_BASE_URL / EVOLUTION_API_KEY)',
  },
  missing_db: {
    label: 'Sem instância',
    title: 'Instância Evolution não provisionada para esta conta',
  },
  missing_remote: {
    label: 'Evo ausente',
    title: 'Registro no banco existe, mas a instância não foi encontrada na Evolution API',
  },
  disconnected: {
    label: 'WA off',
    title: 'Instância existe, porém WhatsApp não está conectado',
  },
  pending: {
    label: 'WA pendente',
    title: 'Instância aguardando pareamento (QR ou código)',
  },
  connected: {
    label: 'WA ok',
    title: 'Instância Evolution conectada ao WhatsApp',
  },
  unknown: {
    label: 'Evo ?',
    title: 'Não foi possível verificar a instância na Evolution API',
  },
};

export interface EvolutionRemoteInstanceSignals {
  connectionStatus: string | null;
  number: string | null;
  ownerJid: string | null;
}

/**
 * Resolves Evolution integrity from server config, DB row and remote instance snapshot.
 */
export function resolveEvolutionIntegrityStatus(input: {
  evolutionConfigured: boolean;
  instanceName: string | null;
  dbConfigured: boolean;
  remote: EvolutionRemoteInstanceSignals | null | undefined;
  remoteCheckFailed: boolean;
}): EvolutionInstanceIntegrityStatus {
  if (!input.evolutionConfigured) {
    return 'not_configured';
  }

  if (!input.instanceName || !input.dbConfigured) {
    return 'missing_db';
  }

  if (input.remoteCheckFailed) {
    return 'unknown';
  }

  if (!input.remote) {
    return 'missing_remote';
  }

  const raw = String(input.remote.connectionStatus ?? '').toLowerCase();
  if (raw === 'open' || raw === 'connected') {
    const hasSession = Boolean(
      input.remote.ownerJid?.trim() ||
        input.remote.number?.trim(),
    );
    return hasSession ? 'connected' : 'pending';
  }

  if (
    raw === 'connecting' ||
    raw === 'pairing' ||
    raw === 'qrcode' ||
    raw === 'pending'
  ) {
    return 'pending';
  }

  return 'disconnected';
}
