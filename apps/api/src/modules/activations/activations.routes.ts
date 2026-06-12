import { FastifyInstance } from 'fastify';
import type { ConnectionRenewalStatus } from '@prisma/client';
import { updateActivationStatusSchema } from '@client-manager/shared';
import { requireTenantId } from '../../core/middleware/require-tenant';
import { sendApiError, sendNotFound, sendValidationError } from '../../core/errors/send-api-error';
import { ActivationsService } from './activations.service';

const activationsService = new ActivationsService();

const VALID_STATUSES: ConnectionRenewalStatus[] = ['pending', 'completed', 'cancelled'];

export async function activationsRoutes(app: FastifyInstance) {
  app.get('/activations', { preHandler: [app.authenticate] }, async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

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
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const count = await activationsService.countPending(tenantId);
    return { count };
  });

  app.get('/activations/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };
    const activation = await activationsService.findById(tenantId, id);
    if (!activation) {
      return sendNotFound(reply, 'Ativação não encontrada');
    }
    return activation;
  });

  app.post('/activations/:id/complete', { preHandler: [app.authenticate] }, async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };
    const body = (request.body ?? {}) as { notes?: string };

    try {
      return await activationsService.complete(id, tenantId, body.notes);
    } catch (error) {
      return sendApiError(reply, error);
    }
  });

  app.patch('/activations/:id/status', { preHandler: [app.authenticate] }, async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };
    const parsed = updateActivationStatusSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }

    try {
      return await activationsService.updateStatus(id, tenantId, parsed.data.status, parsed.data.notes);
    } catch (error) {
      return sendApiError(reply, error);
    }
  });
}
