import QRCode from 'qrcode';
import { expandBrazilPairingPhoneCandidates, isEvolutionSessionStale } from '@client-manager/shared';
import {
  normalizeEvolutionInstanceItem,
  parseEvolutionConnectPayload,
  readEvolutionRemoteState,
  unwrapEvolutionInstanceList,
  type EvolutionInstanceSummary,
} from './evolution-api-payload.util';
import { EvolutionWhatsAppError } from './evolution/evolution-whatsapp.errors';

export type { EvolutionInstanceSummary };

export interface EvolutionInstanceCreateInput {
  instanceName: string;
  token?: string;
}

export interface EvolutionConnectInfo {
  instanceName: string;
  state: string;
  qrCodeBase64?: string;
  pairingCode?: string;
  pairingPhoneNumber?: string;
}

/**
 * Evolution API admin client (instances, QR, connection state).
 *
 * @author João Paulo da Silva
 * @since 4.9.0
 * @creationDate 04/06/2026
 */
export class EvolutionAdminClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  /**
   * Creates a WhatsApp instance on the Evolution server (idempotent if already exists).
   */
  async ensureInstance(input: EvolutionInstanceCreateInput): Promise<void> {
    const existing = await this.fetchInstanceSummary(input.instanceName).catch(() => null);
    if (existing) {
      return;
    }

    await this.createInstance(input);
  }

  /**
   * Creates a WhatsApp instance on the Evolution server (always calls create).
   */
  async createInstance(input: EvolutionInstanceCreateInput): Promise<void> {
    const url = `${this.baseUrl}/instance/create`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        instanceName: input.instanceName,
        token: input.token ?? input.instanceName,
        qrcode: false,
        integration: 'WHATSAPP-BAILEYS',
      }),
    });

    const text = await response.text();
    if (response.ok) {
      return;
    }

    const message = parseEvolutionError(text);
    if (response.status === 409 || /already exists|already in use/i.test(message)) {
      return;
    }

    throw this.providerError(message || `Evolution create instance failed (${response.status})`);
  }

  /**
   * Deletes a WhatsApp instance from the Evolution server.
   */
  async deleteInstance(instanceName: string): Promise<void> {
    const deleted = await this.tryDeleteInstance(instanceName);
    if (!deleted) {
      throw this.providerError(`Evolution delete instance failed for "${instanceName}"`);
    }
  }

  /**
   * Deletes and recreates an instance (clean session for pairing after WhatsApp disconnect).
   */
  async recreateInstance(input: EvolutionInstanceCreateInput): Promise<void> {
    await this.softResetInstance(input.instanceName);

    const deleted = await this.tryDeleteInstance(input.instanceName);
    if (deleted) {
      await sleep(500);
      await this.createInstance(input);
      await sleep(1000);
      return;
    }

    const existing = await this.fetchInstanceSummary(input.instanceName).catch(() => null);
    if (existing && isEvolutionSessionStale(existing)) {
      throw this.resetFailedError(
        `Instância "${input.instanceName}" está presa na Evolution (sessão expirada). ` +
          'Peça ao admin para recriar em Contas ou remova manualmente na Evolution.',
      );
    }

    if (!existing) {
      await this.createInstance(input);
      await sleep(1000);
    }
  }

  /**
   * Fully disconnects an instance on Evolution (logout, delete, recreate empty instance).
   */
  async disconnectInstance(input: EvolutionInstanceCreateInput): Promise<void> {
    try {
      await this.recreateInstance(input);
    } catch (error) {
      if (error instanceof EvolutionWhatsAppError && error.code === 'INSTANCE_RESET_FAILED') {
        await this.softResetInstance(input.instanceName);
      }
      throw error;
    }
  }

  /**
   * Ensures the instance is idle on Evolution before a new QR or pairing attempt.
   */
  async prepareInstanceForConnect(input: EvolutionInstanceCreateInput): Promise<void> {
    const summary = await this.fetchInstanceSummary(input.instanceName).catch(() => null);
    const state = (
      await this.fetchConnectionState(input.instanceName).catch(() => 'close')
    ).toLowerCase();

    if (summary && isEvolutionSessionStale(summary)) {
      await this.softResetInstance(input.instanceName);
      const deleted = await this.tryDeleteInstance(input.instanceName);
      if (deleted) {
        await sleep(500);
        await this.createInstance(input);
        await sleep(1000);
      }
      return;
    }

    const stillLinked =
      state === 'open' ||
      state === 'connected' ||
      state === 'connecting' ||
      Boolean(summary?.ownerJid?.trim());

    if (stillLinked) {
      await this.recreateInstance(input);
      return;
    }

    await this.ensureInstance(input);
  }

  /**
   * Returns QR / pairing data to link WhatsApp on the instance.
   */
  async getConnectInfo(instanceName: string, phone?: string): Promise<EvolutionConnectInfo> {
    if (phone) {
      await this.prepareInstanceForPairing(instanceName);

      const candidates = expandBrazilPairingPhoneCandidates(phone);

      for (let index = 0; index < candidates.length; index += 1) {
        const candidate = candidates[index];
        const connectResult = await this.requestPairingConnect(instanceName, candidate);
        const pairingCode = connectResult.parsed.pairingCode;

        if (pairingCode) {
          await sleep(2000);
          return {
            instanceName,
            state: connectResult.parsed.state,
            pairingCode,
            pairingPhoneNumber: candidate,
          };
        }

        if (index < candidates.length - 1) {
          await this.softResetInstance(instanceName);
        }
      }

      return {
        instanceName,
        state: 'close',
        pairingPhoneNumber: candidates[0] ?? phone,
      };
    }

    let connectResult = await this.fetchConnectPayload(instanceName);
    let parsed = connectResult.parsed;
    let qrCodeBase64 = parsed.qrCodeBase64;

    const summary = await this.fetchInstanceSummary(instanceName).catch(() => null);
    const remoteState = parsed.state.toLowerCase();
    const stale = isEvolutionSessionStale(summary);
    if (
      stale ||
      remoteState === 'open' ||
      remoteState === 'connected' ||
      remoteState === 'connecting'
    ) {
      if (stale) {
        await this.prepareInstanceForConnect({ instanceName, token: instanceName });
      } else {
        await this.recreateInstance({ instanceName, token: instanceName });
      }
      connectResult = await this.fetchConnectPayload(instanceName);
      parsed = connectResult.parsed;
      qrCodeBase64 = parsed.qrCodeBase64;
    }

    if (!qrCodeBase64 && !parsed.pairingCode && parsed.qrCodeRaw) {
      qrCodeBase64 = await QRCode.toDataURL(parsed.qrCodeRaw, { margin: 1, width: 280 });
    }

    if (!qrCodeBase64 && !parsed.pairingCode && isZeroCountQrcode(connectResult.payload)) {
      await this.softResetInstance(instanceName);
      connectResult = await this.fetchConnectPayload(instanceName);
      parsed = connectResult.parsed;
      qrCodeBase64 = parsed.qrCodeBase64;
      if (!qrCodeBase64 && !parsed.pairingCode && parsed.qrCodeRaw) {
        qrCodeBase64 = await QRCode.toDataURL(parsed.qrCodeRaw, { margin: 1, width: 280 });
      }
    }

    return {
      instanceName,
      state: parsed.state,
      qrCodeBase64,
      pairingCode: parsed.pairingCode,
    };
  }

  /**
   * Logs out the WhatsApp session for an instance.
   */
  async logoutInstance(instanceName: string): Promise<void> {
    const url = `${this.baseUrl}/instance/logout/${encodeURIComponent(instanceName)}`;
    let response = await fetch(url, { method: 'DELETE', headers: this.headers() });
    if (response.ok || response.status === 404) {
      return;
    }

    response = await fetch(url, { method: 'POST', headers: this.headers() });
    if (response.ok || response.status === 404) {
      return;
    }

    const text = await response.text();
    throw this.providerError(parseEvolutionError(text) || `Evolution logout failed (${response.status})`);
  }

  /**
   * Restarts an instance session on Evolution (best-effort).
   */
  async restartInstance(instanceName: string): Promise<void> {
    const url = `${this.baseUrl}/instance/restart/${encodeURIComponent(instanceName)}`;
    const response = await fetch(url, { method: 'POST', headers: this.headers() });
    if (response.ok || response.status === 404) {
      return;
    }

    const text = await response.text();
    throw this.providerError(
      parseEvolutionError(text) || `Evolution restart failed (${response.status})`,
    );
  }

  /**
   * Returns summary data for a single instance from the Evolution server.
   */
  async fetchInstanceSummary(instanceName: string): Promise<EvolutionInstanceSummary | null> {
    const instances = await this.fetchAllInstances();
    return instances.get(instanceName) ?? null;
  }

  /**
   * Returns all instances indexed by instance name (single HTTP round-trip).
   */
  async fetchAllInstances(): Promise<Map<string, EvolutionInstanceSummary>> {
    const url = `${this.baseUrl}/instance/fetchInstances`;
    const response = await fetch(url, { method: 'GET', headers: this.headers() });
    const text = await response.text();
    const payload = safeJson(text);

    if (!response.ok) {
      throw this.providerError(
        parseEvolutionError(text) || `Evolution fetchInstances failed (${response.status})`,
      );
    }

    const items = unwrapEvolutionInstanceList(payload);
    const map = new Map<string, EvolutionInstanceSummary>();
    for (const item of items) {
      const summary = normalizeEvolutionInstanceItem(item);
      if (summary) {
        map.set(summary.instanceName, summary);
      }
    }

    return map;
  }

  /**
   * Reads WhatsApp connection state for an instance.
   */
  async fetchConnectionState(instanceName: string): Promise<string> {
    const url = `${this.baseUrl}/instance/connectionState/${encodeURIComponent(instanceName)}`;
    const response = await fetch(url, { method: 'GET', headers: this.headers() });
    const text = await response.text();
    const payload = safeJson(text);

    if (!response.ok) {
      throw this.providerError(
        parseEvolutionError(text) || `Evolution connectionState failed (${response.status})`,
      );
    }

    return readEvolutionRemoteState(payload);
  }

  private async prepareInstanceForPairing(instanceName: string): Promise<void> {
    const summary = await this.fetchInstanceSummary(instanceName).catch(() => null);
    if (summary && isEvolutionSessionStale(summary)) {
      await this.prepareInstanceForConnect({ instanceName, token: instanceName });
      return;
    }

    const deleted = await this.tryDeleteInstance(instanceName);
    if (deleted) {
      await sleep(500);
      await this.createInstance({ instanceName, token: instanceName });
      await sleep(1000);
      return;
    }

    await this.softResetInstance(instanceName);
    await this.ensureInstance({ instanceName, token: instanceName });
  }

  private async softResetInstance(instanceName: string): Promise<void> {
    await this.logoutInstance(instanceName).catch(() => undefined);
    await this.restartInstance(instanceName).catch(() => undefined);
    await sleep(1500);
  }

  private async tryDeleteInstance(instanceName: string): Promise<boolean> {
    const url = `${this.baseUrl}/instance/delete/${encodeURIComponent(instanceName)}`;
    const response = await fetch(url, { method: 'DELETE', headers: this.headers() });
    if (response.ok || response.status === 404) {
      return true;
    }

    return false;
  }

  private async requestPairingConnect(
    instanceName: string,
    phone: string,
  ): Promise<{ payload: Record<string, unknown>; parsed: ReturnType<typeof parseEvolutionConnectPayload> }> {
    const getResult = await this.requestConnect(instanceName, 'GET', phone);
    if (getResult.parsed.pairingCode) {
      return getResult;
    }

    const postResult = await this.requestConnect(instanceName, 'POST', phone).catch(() => null);
    if (postResult?.parsed.pairingCode) {
      return postResult;
    }

    return postResult ?? getResult;
  }

  private async fetchConnectPayload(
    instanceName: string,
  ): Promise<{ payload: Record<string, unknown>; parsed: ReturnType<typeof parseEvolutionConnectPayload> }> {
    return this.requestConnect(instanceName, 'GET');
  }

  private async requestConnect(
    instanceName: string,
    method: 'GET' | 'POST',
    phone?: string,
  ): Promise<{ payload: Record<string, unknown>; parsed: ReturnType<typeof parseEvolutionConnectPayload> }> {
    const basePath = `${this.baseUrl}/instance/connect/${encodeURIComponent(instanceName)}`;
    const url = method === 'GET' && phone ? `${basePath}?number=${encodeURIComponent(phone)}` : basePath;
    const response = await fetch(url, {
      method,
      headers: this.headers(),
      ...(method === 'POST' && phone ? { body: JSON.stringify({ number: phone }) } : {}),
    });
    const text = await response.text();
    const payload = safeJson(text);

    if (!response.ok) {
      if (method === 'POST' && (response.status === 404 || response.status === 405)) {
        return {
          payload,
          parsed: parseEvolutionConnectPayload(payload),
        };
      }

      throw this.providerError(parseEvolutionError(text) || `Evolution connect failed (${response.status})`);
    }

    return {
      payload,
      parsed: parseEvolutionConnectPayload(payload),
    };
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      apikey: this.apiKey,
    };
  }

  private providerError(message: string): EvolutionWhatsAppError {
    return new EvolutionWhatsAppError(message, 'PROVIDER_ERROR');
  }

  private resetFailedError(message: string): EvolutionWhatsAppError {
    return new EvolutionWhatsAppError(message, 'INSTANCE_RESET_FAILED');
  }
}

function safeJson(text: string): Record<string, unknown> {
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function parseEvolutionError(text: string): string {
  const payload = safeJson(text);
  const response = payload.response;
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    const message = (response as Record<string, unknown>).message;
    if (Array.isArray(message)) {
      return message.map(String).join('; ');
    }
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }

  if (Array.isArray(payload.message)) {
    return payload.message.map(String).join('; ');
  }

  return String(payload.message ?? payload.error ?? text).slice(0, 500);
}

function isZeroCountQrcode(payload: Record<string, unknown>): boolean {
  const qrcode = payload.qrcode;
  if (!qrcode || typeof qrcode !== 'object' || Array.isArray(qrcode)) {
    return payload.count === 0;
  }

  return (qrcode as Record<string, unknown>).count === 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
