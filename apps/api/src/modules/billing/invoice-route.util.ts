import type { FastifyReply } from 'fastify';
import { InvoiceActionError } from './invoice-errors';

export function handleInvoiceActionError(reply: FastifyReply, error: unknown) {
  if (error instanceof InvoiceActionError) {
    const status =
      error.code === 'NOT_FOUND' ? 404 : error.code === 'CONFLICT' ? 409 : 400;
    return reply.status(status).send({ message: error.message });
  }
  throw error;
}
