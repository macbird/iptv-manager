import type { FastifyRequest } from 'fastify';

/**
 * Returns the tenant account user id from the JWT when the caller is a tenant user.
 * Platform admin tokens are ignored to avoid FK violations on audit_logs.accountUserId.
 */
export function resolveActorUserId(request: FastifyRequest): string | undefined {
  const user = request.user as { sub?: string; type?: string } | undefined;
  if (user?.type !== 'tenant_user') {
    return undefined;
  }
  return user.sub;
}
