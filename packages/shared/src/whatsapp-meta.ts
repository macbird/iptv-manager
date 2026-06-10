import { z } from 'zod';

export const WHATSAPP_CONNECTION_STATUS_VALUES = ['disconnected', 'pending', 'connected'] as const;
export type WhatsAppConnectionStatusValue = (typeof WHATSAPP_CONNECTION_STATUS_VALUES)[number];

export const WHATSAPP_CONNECTION_STATUS_LABELS: Record<WhatsAppConnectionStatusValue, string> = {
  disconnected: 'Desconectado',
  pending: 'Pendente',
  connected: 'Conectado',
};

export const metaEmbeddedSignupSchema = z.object({
  code: z.string().min(1, 'Código de autorização obrigatório'),
  wabaId: z.string().min(1, 'WABA ID obrigatório'),
  phoneNumberId: z.string().min(1, 'Phone Number ID obrigatório'),
});

export type MetaEmbeddedSignupInput = z.infer<typeof metaEmbeddedSignupSchema>;

export interface MetaEmbeddedSignupConfigDto {
  appId: string;
  configId: string;
  graphApiVersion: string;
}

export interface WhatsAppMetaConnectionDto {
  provider: string;
  connectionStatus: WhatsAppConnectionStatusValue;
  wabaId: string | null;
  phoneNumberId: string | null;
  displayPhoneNumber: string | null;
  tokenConfigured: boolean;
  tokenExpiresAt: string | null;
  /** Evolution-only fields */
  instanceUrl: string | null;
}
