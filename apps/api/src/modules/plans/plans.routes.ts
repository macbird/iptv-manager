import { FastifyInstance } from 'fastify';
import { PlansService } from './plans.service';
import { planSchema } from '@client-manager/shared';
import { requireTenantId } from '../../core/middleware/require-tenant';
import { pickListFilters } from '../../core/utils/parse-list-filters';
import { isSelectableOnlyQuery } from '../../core/utils/parse-selectable-only';
import { sendApiError, sendNotFound, sendValidationError } from '../../core/errors/send-api-error';

const PLAN_LIST_FILTER_KEYS = [
  'status',
  'billingCycle',
  'minPrice',
  'maxPrice',
  'sortBy',
] as const;

const plansService = new PlansService();

export async function plansRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { page, pageSize, filter } = request.query as {
      page?: string;
      pageSize?: string;
      filter?: string;
    };
    const query = request.query as Record<string, unknown>;
    const listFilters = pickListFilters(query, PLAN_LIST_FILTER_KEYS);
    const selectableOnly = isSelectableOnlyQuery(query);
    return await plansService.list(
      tenantId,
      parseInt(page || '1', 10),
      parseInt(pageSize || '10', 10),
      filter || '',
      listFilters,
      selectableOnly,
    );
  });

  app.get('/:id', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };
    const plan = await plansService.findById(tenantId, id);
    if (!plan) {
      return sendNotFound(reply, 'Plano não encontrado');
    }
    return plan;
  });

  app.post('', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const parsed = planSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }
    try {
      return await plansService.create(tenantId, parsed.data);
    } catch (error) {
      return sendApiError(reply, error);
    }
  });

  app.put('/:id', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };
    const parsed = planSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }
    try {
      await plansService.update(tenantId, id, parsed.data);
      return reply.status(204).send();
    } catch (error) {
      return sendApiError(reply, error);
    }
  });

  app.patch('/:id/deactivate', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };
    try {
      return await plansService.deactivate(tenantId, id);
    } catch (error) {
      return sendApiError(reply, error);
    }
  });

  app.patch('/:id/activate', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };
    try {
      return await plansService.activate(tenantId, id);
    } catch (error) {
      return sendApiError(reply, error);
    }
  });
}
