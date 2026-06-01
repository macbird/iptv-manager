import { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    tenantId?: string;
    userId?: string;
    role?: string;
  }
}

export function resolveTenantId(request: FastifyRequest): string | undefined {
  const user = request.user as { tenantId?: string; accountId?: string } | undefined;
  if (!user) return undefined;
  return user.tenantId ?? user.accountId;
}

export async function tenantContextMiddleware(request: FastifyRequest, _reply: FastifyReply) {
  if (request.user) {
    const user = request.user as { sub?: string; role?: string; tenantId?: string; accountId?: string };
    request.tenantId = resolveTenantId(request);
    request.userId = user.sub;
    request.role = user.role;
  }
}
