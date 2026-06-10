export class MetaWhatsAppError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_CONFIGURED' | 'API_ERROR' | 'INVALID_TOKEN' | 'VALIDATION',
  ) {
    super(message);
    this.name = 'MetaWhatsAppError';
  }
}
