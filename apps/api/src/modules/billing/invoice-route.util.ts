import type { FastifyReply } from 'fastify';
import { sendApiError } from '../../core/errors/send-api-error';

export function handleInvoiceActionError(reply: FastifyReply, error: unknown) {
  return sendApiError(reply, error);
}
