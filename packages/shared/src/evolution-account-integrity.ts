/**
 * Evolution WhatsApp instance integrity for admin account listings.
 */

export type EvolutionInstanceIntegrityStatus =
  | 'not_configured'
  | 'missing_db'
  | 'missing_remote'
  | 'disconnected'
  | 'stale_session'
  | 'pending'
  | 'connected'
  | 'unknown';

export type EvolutionInstanceAnomalyCode =
  | 'stale_session'
  | 'db_remote_status_mismatch'
  | 'reset_likely_blocked';

export interface EvolutionInstanceAnomaly {
  code: EvolutionInstanceAnomalyCode;
  message: string;
  severity: 'warning' | 'critical';
}

export interface AccountEvolutionIntegrity {
  status: EvolutionInstanceIntegrityStatus;
  instanceName: string | null;
  displayPhoneNumber: string | null;
  anomalies: EvolutionInstanceAnomaly[];
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
  stale_session: {
    label: 'Evo presa',
    title:
      'Sessão WhatsApp expirou na Evolution, mas a instância não foi liberada. Recrie a instância.',
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

export const EVOLUTION_ANOMALY_LABELS: Record<
  EvolutionInstanceAnomalyCode,
  { label: string; title: string }
> = {
  stale_session: {
    label: 'Sessão expirada',
    title: 'WhatsApp desconectou na Evolution (401/403) mas a instância continua marcada como ativa',
  },
  db_remote_status_mismatch: {
    label: 'Status divergente',
    title: 'Status no PixFlow difere do estado reportado pela Evolution API',
  },
  reset_likely_blocked: {
    label: 'Reset bloqueado',
    title:
      'Instância provavelmente não pode ser recriada via API (delete/logout falham). Recrie manualmente.',
  },
};

export interface EvolutionRemoteInstanceSignals {
  connectionStatus: string | null;
  number: string | null;
  ownerJid: string | null;
  disconnectionReasonCode?: number | null;
  disconnectionAt?: string | null;
}

/**
 * Returns true when Evolution metadata indicates an expired WhatsApp session still bound to the instance.
 */
export function isEvolutionSessionStale(
  remote: EvolutionRemoteInstanceSignals | null | undefined,
): boolean {
  if (!remote) {
    return false;
  }

  if (remote.disconnectionReasonCode != null) {
    return true;
  }

  return Boolean(remote.disconnectionAt?.trim());
}

/**
 * Detects operational anomalies between PixFlow DB state and Evolution remote metadata.
 */
export function detectEvolutionInstanceAnomalies(input: {
  dbConnectionStatus: string | null | undefined;
  remote: EvolutionRemoteInstanceSignals | null | undefined;
}): EvolutionInstanceAnomaly[] {
  const anomalies: EvolutionInstanceAnomaly[] = [];
  const remote = input.remote;
  if (!remote) {
    return anomalies;
  }

  if (isEvolutionSessionStale(remote)) {
    anomalies.push({
      code: 'stale_session',
      message: EVOLUTION_ANOMALY_LABELS.stale_session.label,
      severity: 'critical',
    });
    anomalies.push({
      code: 'reset_likely_blocked',
      message: EVOLUTION_ANOMALY_LABELS.reset_likely_blocked.label,
      severity: 'critical',
    });
  }

  const dbStatus = String(input.dbConnectionStatus ?? '').toLowerCase();
  const rawRemote = String(remote.connectionStatus ?? '').toLowerCase();
  const remoteLooksConnected =
    (rawRemote === 'open' || rawRemote === 'connected') &&
    Boolean(remote.ownerJid?.trim() || remote.number?.trim()) &&
    !isEvolutionSessionStale(remote);
  const remoteLooksDisconnected =
    rawRemote === 'close' || rawRemote === 'closed' || rawRemote === 'disconnected';

  if (dbStatus === 'disconnected' && remoteLooksConnected) {
    anomalies.push({
      code: 'db_remote_status_mismatch',
      message: 'PixFlow desconectado, Evolution ainda parece conectada',
      severity: 'warning',
    });
  }

  if (dbStatus === 'connected' && remoteLooksDisconnected) {
    anomalies.push({
      code: 'db_remote_status_mismatch',
      message: 'PixFlow conectado, Evolution reporta instância fechada',
      severity: 'warning',
    });
  }

  return dedupeAnomalies(anomalies);
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

  if (isEvolutionSessionStale(input.remote)) {
    return 'stale_session';
  }

  const raw = String(input.remote.connectionStatus ?? '').toLowerCase();
  if (raw === 'open' || raw === 'connected') {
    const hasSession = Boolean(
      input.remote.ownerJid?.trim() || input.remote.number?.trim(),
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

function dedupeAnomalies(
  anomalies: EvolutionInstanceAnomaly[],
): EvolutionInstanceAnomaly[] {
  const seen = new Set<EvolutionInstanceAnomalyCode>();
  return anomalies.filter((item) => {
    if (seen.has(item.code)) {
      return false;
    }
    seen.add(item.code);
    return true;
  });
}
