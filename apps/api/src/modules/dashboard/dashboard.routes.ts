import { FastifyInstance } from 'fastify';
import { DashboardService } from './dashboard.service';
import { requireTenantId } from '../../core/middleware/require-tenant';

const dashboardService = new DashboardService();

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/stats', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    return await dashboardService.getStats(tenantId);
  });

  app.get('/expirations', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { limit } = request.query as { limit?: string };
    return await dashboardService.getUpcomingExpirations(
      tenantId,
      limit ? parseInt(limit, 10) : 5,
    );
  });
}
