import { FastifyReply, FastifyRequest } from 'fastify';
import { resolveTenantId } from './tenant-context';

export function requireTenantId(request: FastifyRequest, reply: FastifyReply): string | null {
  const tenantId = request.tenantId ?? resolveTenantId(request);

  if (!tenantId) {
    reply.status(403).send({
      message: 'Tenant context is required. Use a tenant account token, not an admin token.',
    });
    return null;
  }

  request.tenantId = tenantId;
  return tenantId;
}
