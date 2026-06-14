import QRCode from 'qrcode';
import { expandBrazilPairingPhoneCandidates } from '@client-manager/shared';
import {
  normalizeEvolutionInstanceItem,
  parseEvolutionConnectPayload,
  readEvolutionRemoteState,
  unwrapEvolutionInstanceList,
  type EvolutionInstanceSummary,
} from './evolution-api-payload.util';

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
    if (response.status === 409 || /already exists/i.test(message)) {
      return;
    }

    throw new Error(message || `Evolution create instance failed (${response.status})`);
  }

  /**
   * Deletes a WhatsApp instance from the Evolution server.
   */
  async deleteInstance(instanceName: string): Promise<void> {
    const url = `${this.baseUrl}/instance/delete/${encodeURIComponent(instanceName)}`;
    const response = await fetch(url, { method: 'DELETE', headers: this.headers() });
    if (response.ok || response.status === 404) {
      return;
    }

    const text = await response.text();
    const payload = safeJson(text);
    throw new Error(
      (payload.message as string) || `Evolution delete instance failed (${response.status})`,
    );
  }

  /**
   * Deletes and recreates an instance (clean session for pairing after WhatsApp disconnect).
   */
  async recreateInstance(input: EvolutionInstanceCreateInput): Promise<void> {
    await this.logoutInstance(input.instanceName).catch(() => undefined);
    await this.deleteInstance(input.instanceName);
    await sleep(500);
    await this.createInstance(input);
    await sleep(1000);
  }

  /**
   * Returns QR / pairing data to link WhatsApp on the instance.
   */
  async getConnectInfo(instanceName: string, phone?: string): Promise<EvolutionConnectInfo> {
    if (phone) {
      await this.recreateInstance({
        instanceName,
        token: instanceName,
      });

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
          await this.resetInstanceSession(instanceName);
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

    if (!qrCodeBase64 && !parsed.pairingCode && parsed.qrCodeRaw) {
      qrCodeBase64 = await QRCode.toDataURL(parsed.qrCodeRaw, { margin: 1, width: 280 });
    }

    if (!qrCodeBase64 && !parsed.pairingCode && isZeroCountQrcode(connectResult.payload)) {
      await this.resetInstanceSession(instanceName);
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

  private async resetInstanceSession(instanceName: string): Promise<void> {
    await this.logoutInstance(instanceName).catch(() => undefined);
    await sleep(1200);
  }

  private async requestPairingConnect(
    instanceName: string,
    phone: string,
  ): Promise<{ payload: Record<string, unknown>; parsed: ReturnType<typeof parseEvolutionConnectPayload> }> {
    const postResult = await this.requestConnect(instanceName, 'POST', phone).catch(() => null);
    if (postResult?.parsed.pairingCode) {
      return postResult;
    }

    const getResult = await this.requestConnect(instanceName, 'GET', phone);
    if (getResult.parsed.pairingCode) {
      return getResult;
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
      throw new Error(
        (payload.message as string) || `Evolution connect failed (${response.status})`,
      );
    }

    return {
      payload,
      parsed: parseEvolutionConnectPayload(payload),
    };
  }

  /**
   * Logs out the WhatsApp session for an instance.
   */
  async logoutInstance(instanceName: string): Promise<void> {
    const url = `${this.baseUrl}/instance/logout/${encodeURIComponent(instanceName)}`;
    const response = await fetch(url, { method: 'DELETE', headers: this.headers() });
    if (response.ok || response.status === 404) {
      return;
    }

    const text = await response.text();
    const payload = safeJson(text);
    throw new Error(
      (payload.message as string) || `Evolution logout failed (${response.status})`,
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
      throw new Error(
        (payload.message as string) || `Evolution fetchInstances failed (${response.status})`,
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
      throw new Error(
        (payload.message as string) || `Evolution connectionState failed (${response.status})`,
      );
    }

    return readEvolutionRemoteState(payload);
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      apikey: this.apiKey,
    };
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
