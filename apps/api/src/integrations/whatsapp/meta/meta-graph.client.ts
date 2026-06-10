import { getMetaPlatformConfig } from './meta-whatsapp.config';
import { MetaWhatsAppError } from './meta-whatsapp.errors';

interface GraphErrorBody {
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
}

/**
 * Minimal client for Meta Graph API (WhatsApp Cloud API).
 */
export class MetaGraphClient {
  constructor(
    private readonly accessToken: string,
    private readonly graphApiVersion: string,
  ) {}

  /**
   * Exchanges an Embedded Signup authorization code for a business access token.
   */
  static async exchangeEmbeddedSignupCode(code: string): Promise<{
    accessToken: string;
    expiresIn: number | null;
  }> {
    const platform = getMetaPlatformConfig();
    if (!platform) {
      throw new MetaWhatsAppError(
        'Meta Tech Provider não configurado no servidor (META_APP_ID / META_APP_SECRET / META_EMBEDDED_SIGNUP_CONFIG_ID).',
        'NOT_CONFIGURED',
      );
    }

    const url = new URL(`https://graph.facebook.com/${platform.graphApiVersion}/oauth/access_token`);
    url.searchParams.set('client_id', platform.appId);
    url.searchParams.set('client_secret', platform.appSecret);
    url.searchParams.set('code', code);

    const response = await fetch(url);
    const payload = (await response.json()) as GraphErrorBody & {
      access_token?: string;
      expires_in?: number;
    };

    if (!response.ok || !payload.access_token) {
      throw new MetaWhatsAppError(
        payload.error?.message ?? `Falha ao trocar código Meta (${response.status})`,
        'API_ERROR',
      );
    }

    return {
      accessToken: payload.access_token,
      expiresIn: payload.expires_in ?? null,
    };
  }

  /**
   * Subscribes the platform app to webhook events for the customer's WABA.
   */
  async subscribeAppToWaba(wabaId: string): Promise<void> {
    const response = await this.request(`/${wabaId}/subscribed_apps`, { method: 'POST' });
    if (!response.ok) {
      const payload = (await response.json()) as GraphErrorBody;
      throw new MetaWhatsAppError(
        payload.error?.message ?? `Falha ao inscrever app na WABA (${response.status})`,
        'API_ERROR',
      );
    }
  }

  /**
   * Loads display phone number metadata for UI feedback.
   */
  async getPhoneNumberDisplay(phoneNumberId: string): Promise<string | null> {
    const response = await this.request(`/${phoneNumberId}`, {
      query: { fields: 'display_phone_number,verified_name' },
    });
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      display_phone_number?: string;
      verified_name?: string;
    };

    return payload.display_phone_number ?? payload.verified_name ?? null;
  }

  /**
   * Sends a plain text WhatsApp message via Cloud API.
   */
  async sendTextMessage(phoneNumberId: string, toE164: string, body: string): Promise<string> {
    const to = toE164.replace(/\D/g, '');
    const response = await this.request(`/${phoneNumberId}/messages`, {
      method: 'POST',
      body: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: false, body },
      },
    });

    const payload = (await response.json()) as GraphErrorBody & {
      messages?: Array<{ id?: string }>;
    };

    if (!response.ok) {
      throw new MetaWhatsAppError(
        payload.error?.message ?? `Falha ao enviar WhatsApp Meta (${response.status})`,
        'API_ERROR',
      );
    }

    return payload.messages?.[0]?.id ?? `meta_${Date.now()}`;
  }

  private async request(
    path: string,
    options: {
      method?: string;
      query?: Record<string, string>;
      body?: unknown;
    } = {},
  ): Promise<Response> {
    const url = new URL(`https://graph.facebook.com/${this.graphApiVersion}${path}`);
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        url.searchParams.set(key, value);
      }
    }

    return fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  }

  static fromPlatformDefaults(accessToken: string): MetaGraphClient {
    const platform = getMetaPlatformConfig();
    if (!platform) {
      throw new MetaWhatsAppError('Meta Tech Provider não configurado no servidor.', 'NOT_CONFIGURED');
    }
    return new MetaGraphClient(accessToken, platform.graphApiVersion);
  }
}
