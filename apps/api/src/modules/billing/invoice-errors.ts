export type InvoiceErrorCode = 'NOT_FOUND' | 'NOT_ALLOWED' | 'CONFLICT';

export class InvoiceActionError extends Error {
  constructor(
    message: string,
    readonly code: InvoiceErrorCode,
  ) {
    super(message);
    this.name = 'InvoiceActionError';
  }
}
