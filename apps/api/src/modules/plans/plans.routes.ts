import { FastifyInstance } from 'fastify';
import { PlansService } from './plans.service';
import { planSchema } from '@client-manager/shared';

const plansService = new PlansService();

export async function plansRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('', async (request) => {
    app.log.info({ tenantId: request.tenantId }, 'DEBUG: GET /plans');
    const { page, pageSize, filter } = request.query as { page?: string, pageSize?: string, filter?: string };
    return await plansService.list(
      request.tenantId!, 
      parseInt(page || '1'), 
      parseInt(pageSize || '10'), 
      filter || ''
    );
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    app.log.info({ tenantId: request.tenantId, id }, 'DEBUG: GET /plans/:id');
    // Implement or fix the service method if missing
    return await plansService.list(request.tenantId!, 1, 100, '').then(res => res.data.find(p => p.id === id));
  });

  app.post('', async (request, reply) => {
    const data = planSchema.parse(request.body);
    return await plansService.create(request.tenantId!, data);
  });

  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    app.log.info({ body: request.body, params: request.params, url: request.url }, 'DEBUG: PUT plan request received');
    const data = planSchema.parse(request.body);
    await plansService.update(request.tenantId!, id, data);
    return reply.status(204).send();
  });

  app.delete('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return await plansService.delete(request.tenantId!, id);
  });
}
