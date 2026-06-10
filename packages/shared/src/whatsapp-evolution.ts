import { z } from 'zod';
import type { WhatsAppConnectionStatusValue } from './whatsapp-meta';

export const evolutionConnectSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\d{10,15}$/, 'Informe DDD + número (somente dígitos; 55 é opcional)')
    .optional(),
});

export type EvolutionConnectInput = z.infer<typeof evolutionConnectSchema>;

export const evolutionTestMessageSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\d{10,15}$/, 'Informe DDD + número (somente dígitos; 55 é opcional)')
    .optional(),
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
}

export interface EvolutionTestMessageResponseDto {
  providerMessageId: string;
  sentTo: string;
}
