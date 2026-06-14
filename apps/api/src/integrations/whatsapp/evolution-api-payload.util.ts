export interface EvolutionInstanceSummary {
  instanceName: string;
  connectionStatus: string | null;
  number: string | null;
  ownerJid: string | null;
}

/**
 * Normalizes Evolution API v1/v2 list item payloads into a stable instance summary.
 *
 * @author João Paulo da Silva
 * @since 4.9.0
 * @creationDate 14/06/2026
 */
export function normalizeEvolutionInstanceItem(item: unknown): EvolutionInstanceSummary | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const row = item as Record<string, unknown>;
  const nested = row.instance;
  const source =
    nested && typeof nested === 'object' && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : row;

  const instanceName = String(source.instanceName ?? source.name ?? '').trim();
  if (!instanceName) {
    return null;
  }

  const connectionStatus = readEvolutionConnectionStatus(
    source.connectionStatus ?? source.status ?? source.state,
  );
  const ownerJid = readOptionalString(source.ownerJid ?? source.owner) ?? null;
  const number =
    readOptionalString(source.number) ??
    extractDigitsFromOwnerJid(ownerJid) ??
    null;

  return {
    instanceName,
    connectionStatus,
    number,
    ownerJid,
  };
}

/**
 * Reads connection state from Evolution connect / connectionState payloads.
 */
export function readEvolutionRemoteState(payload: Record<string, unknown>): string {
  const instanceBlock = payload.instance;
  if (instanceBlock && typeof instanceBlock === 'object' && !Array.isArray(instanceBlock)) {
    const nestedState = readEvolutionConnectionStatus(
      (instanceBlock as Record<string, unknown>).state ??
        (instanceBlock as Record<string, unknown>).status,
    );
    if (nestedState) {
      return nestedState;
    }
  }

  return (
    readEvolutionConnectionStatus(payload.state ?? payload.status) ??
    'unknown'
  );
}

/**
 * Extracts QR / pairing fields from Evolution connect endpoint payloads (v1 and v2).
 */
export function parseEvolutionConnectPayload(payload: Record<string, unknown>): {
  state: string;
  qrCodeBase64: string | undefined;
  pairingCode: string | undefined;
  qrCodeRaw: string | undefined;
} {
  const instanceBlock = payload.instance;
  const qrcodeBlock = payload.qrcode;
  const qrBlock = payload.qr;

  const state = readEvolutionRemoteState(payload);

  const base64 =
    readOptionalString(payload.base64) ??
    readNestedBase64(qrcodeBlock) ??
    readNestedBase64(qrBlock);

  const pairingCode =
    readOptionalString(payload.pairingCode) ??
    readOptionalString(
      qrcodeBlock && typeof qrcodeBlock === 'object'
        ? (qrcodeBlock as Record<string, unknown>).pairingCode
        : undefined,
    );

  const qrCodeRaw =
    !base64 && !pairingCode
      ? readOptionalString(payload.code) ??
        readOptionalString(
          qrcodeBlock && typeof qrcodeBlock === 'object'
            ? (qrcodeBlock as Record<string, unknown>).code
            : undefined,
        )
      : undefined;

  return {
    state,
    qrCodeBase64: base64,
    pairingCode,
    qrCodeRaw,
  };
}

/**
 * Unwraps fetchInstances body variants ({ response: [] } or plain array).
 */
export function unwrapEvolutionInstanceList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const response = record.response;
  if (Array.isArray(response)) {
    return response;
  }

  return [];
}

function readEvolutionConnectionStatus(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    const nested = value as Record<string, unknown>;
    const state = nested.state ?? nested.status;
    return state !== undefined && state !== null ? String(state) : null;
  }

  const text = String(value).trim();
  return text || null;
}

function readNestedBase64(value: unknown): string | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return readOptionalString((value as Record<string, unknown>).base64);
}

function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function extractDigitsFromOwnerJid(ownerJid: string | null): string | null {
  if (!ownerJid) {
    return null;
  }

  const digits = ownerJid.split('@')[0]?.replace(/\D/g, '');
  return digits || null;
}
