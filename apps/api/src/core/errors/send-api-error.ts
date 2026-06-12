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
  const mapped = mapErrorToApiResponse(error);
  return reply.status(mapped.statusCode).send(mapped.body);
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

/**
 * Sends an unauthorized error with the standard API error contract.
 */
export function sendUnauthorized(reply: FastifyReply, message = 'Não autorizado') {
  return reply.status(401).send({
    message,
    code: API_ERROR_CODES.UNAUTHORIZED,
  });
}

/**
 * Sends a forbidden error with the standard API error contract.
 */
export function sendForbidden(reply: FastifyReply, message: string) {
  return reply.status(403).send({
    message,
    code: API_ERROR_CODES.NOT_ALLOWED,
  });
}
