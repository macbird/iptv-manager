import { z } from 'zod';
import type { WhatsAppConnectionStatusValue } from './whatsapp-meta';
import { optionalPhoneE164Schema } from './phone-e164';

export const evolutionConnectSchema = z.object({
  phone: optionalPhoneE164Schema,
});

export type EvolutionConnectInput = z.infer<typeof evolutionConnectSchema>;

export const evolutionTestMessageSchema = z.object({
  phone: optionalPhoneE164Schema,
  text: z.string().trim().min(1).max(500).optional(),
});

export type EvolutionTestMessageInput = z.infer<typeof evolutionTestMessageSchema>;

export interface WhatsAppEvolutionConnectionDto {
  provider: 'evolution';
  connectionStatus: WhatsAppConnectionStatusValue;
  instanceName: string | null;
  displayPhoneNumber: string | null;
  instanceConfigured: boolean;
}

export interface EvolutionConnectResponseDto {
  state: string;
  connectionStatus: WhatsAppConnectionStatusValue;
  qrCodeBase64: string | null;
  pairingCode: string | null;
  /** Phone number used to generate the pairing code (must match WhatsApp entry). */
  pairingPhoneNumber: string | null;
}

export interface EvolutionTestMessageResponseDto {
  providerMessageId: string;
  sentTo: string;
}
