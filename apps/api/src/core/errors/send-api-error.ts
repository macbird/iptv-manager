import type { FastifyReply } from 'fastify';
import type { ZodError } from 'zod';
import { API_ERROR_CODES } from '@client-manager/shared';
import { mapErrorToApiResponse } from './api-error.mapper';

/**
 * Sends a standardized API error response derived from a thrown error.
 */
export function sendApiError(reply: FastifyReply, error: unknown) {
  const mapped = mapErrorToApiResponse(error);
  return reply.status(mapped.statusCode).send(mapped.body);
}

/**
 * Sends a validation error response from a Zod parse failure.
 */
export function sendValidationError(reply: FastifyReply, error: ZodError) {
  const first = error.issues[0];
  return reply.status(400).send({
    message: first?.message ?? 'Dados inválidos',
    code: API_ERROR_CODES.VALIDATION_ERROR,
    details: { issues: error.issues },
  });
}

/**
 * Sends a not-found error with the standard API error contract.
 */
export function sendNotFound(reply: FastifyReply, message: string) {
  return reply.status(404).send({
    message,
    code: API_ERROR_CODES.NOT_FOUND,
  });
}
