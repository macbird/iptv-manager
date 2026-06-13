import type { FastifyInstance } from 'fastify';
import { requireTenantId } from '../../core/middleware/require-tenant';
import { AuditService } from './audit.service';

const auditService = new AuditService();

/**
 * Tenant audit log routes.
 */
export async function auditRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/logs', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const query = request.query as Record<string, string>;
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const filter = query.filter ?? query.q ?? '';

    return auditService.list(tenantId, page, pageSize, filter);
  });
}
