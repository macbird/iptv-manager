import type { SendMessageInput, WhatsAppProvider } from './whatsapp-provider.interface';

interface EvolutionSendResponse {
  key?: { id?: string };
}

/** Evolution API adapter for sending text messages. */
export class EvolutionWhatsAppProvider implements WhatsAppProvider {
  constructor(
    private readonly instanceUrl: string,
    private readonly apiKey: string,
    private readonly instanceName: string,
  ) {}

  /**
   * Sends a plain text message to the given phone number.
   */
  async sendText(input: SendMessageInput): Promise<{ providerMessageId: string }> {
    const base = this.instanceUrl.replace(/\/$/, '');
    const url = `${base}/message/sendText/${encodeURIComponent(this.instanceName)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.apiKey,
      },
      body: JSON.stringify({
        number: input.phoneE164,
        text: input.text,
      }),
    });

    const text = await response.text();
    let payload: EvolutionSendResponse = {};
    if (text) {
      try {
        payload = JSON.parse(text) as EvolutionSendResponse;
      } catch {
        payload = {};
      }
    }

    if (!response.ok) {
      throw new Error(
        (payload as { message?: string }).message ?? `Evolution API error (${response.status})`,
      );
    }

    return { providerMessageId: payload.key?.id ?? `evo_${Date.now()}` };
  }
}
