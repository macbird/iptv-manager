import { FastifyInstance } from 'fastify';
import type { ConnectionRenewalStatus } from '@prisma/client';
import { updateActivationStatusSchema } from '@client-manager/shared';
import { ActivationsService } from './activations.service';

const activationsService = new ActivationsService();

const VALID_STATUSES: ConnectionRenewalStatus[] = ['pending', 'completed', 'cancelled'];

export async function activationsRoutes(app: FastifyInstance) {
  app.get('/activations', { preHandler: [app.authenticate] }, async (request, reply) => {
    const tenantId = (request as { tenantId?: string }).tenantId;
    if (!tenantId) {
      return reply.status(403).send({ message: 'Tenant required' });
    }

    const query = request.query as Record<string, string>;
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const filter = query.filter ?? query.q ?? '';
    const statusParam = query.status;
    const status =
      statusParam && VALID_STATUSES.includes(statusParam as ConnectionRenewalStatus)
        ? (statusParam as ConnectionRenewalStatus)
        : undefined;

    return activationsService.list(tenantId, page, pageSize, filter, status);
  });

  app.get('/activations/pending-count', { preHandler: [app.authenticate] }, async (request, reply) => {
    const tenantId = (request as { tenantId?: string }).tenantId;
    if (!tenantId) {
      return reply.status(403).send({ message: 'Tenant required' });
    }

    const count = await activationsService.countPending(tenantId);
    return { count };
  });

  app.get('/activations/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const tenantId = (request as { tenantId?: string }).tenantId;
    if (!tenantId) {
      return reply.status(403).send({ message: 'Tenant required' });
    }

    const { id } = request.params as { id: string };
    const activation = await activationsService.findById(tenantId, id);
    if (!activation) {
      return reply.status(404).send({ message: 'Activation not found' });
    }
    return activation;
  });

  app.post('/activations/:id/complete', { preHandler: [app.authenticate] }, async (request, reply) => {
    const tenantId = (request as { tenantId?: string }).tenantId;
    if (!tenantId) {
      return reply.status(403).send({ message: 'Tenant required' });
    }

    const { id } = request.params as { id: string };
    const body = (request.body ?? {}) as { notes?: string };

    try {
      return await activationsService.complete(id, tenantId, body.notes);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete activation';
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });

  app.patch('/activations/:id/status', { preHandler: [app.authenticate] }, async (request, reply) => {
    const tenantId = (request as { tenantId?: string }).tenantId;
    if (!tenantId) {
      return reply.status(403).send({ message: 'Tenant required' });
    }

    const { id } = request.params as { id: string };
    const parsed = updateActivationStatusSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ message: parsed.error.errors[0]?.message ?? 'Invalid payload' });
    }

    try {
      return await activationsService.updateStatus(id, tenantId, parsed.data.status, parsed.data.notes);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update activation status';
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });
}
