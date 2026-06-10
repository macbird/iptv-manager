/**
 * Evolution WhatsApp integration errors.
 *
 * @author João Paulo da Silva
 * @since 4.9.0
 * @creationDate 10/06/2026
 * Copyright (c) 2026 NTT DATA Brasil Consultologia de Negócio e Tecnologia da Informação Ltda.
 * Todos os direitos reservados.
 */

export class EvolutionWhatsAppError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_CONFIGURED' | 'NO_ACCOUNT' | 'NOT_CONNECTED' = 'NOT_CONFIGURED',
  ) {
    super(message);
    this.name = 'EvolutionWhatsAppError';
  }
}
