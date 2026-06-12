import { FastifyReply, FastifyRequest } from 'fastify';
import { sendForbidden } from '../errors/send-api-error';
import { resolveTenantId } from './tenant-context';

export function requireTenantId(request: FastifyRequest, reply: FastifyReply): string | null {
  const tenantId = request.tenantId ?? resolveTenantId(request);

  if (!tenantId) {
    sendForbidden(
      reply,
      'Contexto de tenant obrigatório. Use um token de conta de revenda, não de administrador.',
    );
    return null;
  }

  request.tenantId = tenantId;
  return tenantId;
}
