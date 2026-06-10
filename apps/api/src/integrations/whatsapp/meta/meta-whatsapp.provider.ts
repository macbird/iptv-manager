import type { SendMessageInput, WhatsAppProvider } from '../whatsapp-provider.interface';
import { MetaGraphClient } from './meta-graph.client';

/**
 * WhatsApp Cloud API adapter (Meta official API, per-tenant token from Embedded Signup).
 */
export class MetaWhatsAppProvider implements WhatsAppProvider {
  constructor(
    private readonly accessToken: string,
    private readonly phoneNumberId: string,
  ) {}

  /**
   * Sends a plain text message using the tenant WABA phone number.
   */
  async sendText(input: SendMessageInput): Promise<{ providerMessageId: string }> {
    const client = MetaGraphClient.fromPlatformDefaults(this.accessToken);
    const providerMessageId = await client.sendTextMessage(
      this.phoneNumberId,
      input.phoneE164,
      input.text,
    );
    return { providerMessageId };
  }
}
