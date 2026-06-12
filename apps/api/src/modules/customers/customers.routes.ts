import { FastifyInstance } from 'fastify';
import { CustomersService } from './customers.service';
import { customerSchema } from '@client-manager/shared';
import { requireTenantId } from '../../core/middleware/require-tenant';
import { pickListFilters } from '../../core/utils/parse-list-filters';
import { isSelectableOnlyQuery } from '../../core/utils/parse-selectable-only';
import { sendApiError, sendNotFound, sendValidationError } from '../../core/errors/send-api-error';

const CUSTOMER_LIST_FILTER_KEYS = [
  'status',
  'planId',
  'expiresFrom',
  'expiresTo',
  'expiredOnly',
  'upcomingOnly',
  'expiringWithinDays',
  'sortBy',
] as const;

const customersService = new CustomersService();

function extractTagIds(body: Record<string, unknown>): string[] | undefined {
  if (!Array.isArray(body.tagIds)) return undefined;
  return body.tagIds.filter((id): id is string => typeof id === 'string');
}

function extractConnections(body: Record<string, unknown>) {
  if (!Array.isArray(body.connections)) return undefined;
  return body.connections;
}

export async function customersRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { page, pageSize, filter } = request.query as {
      page?: string;
      pageSize?: string;
      filter?: string;
    };
    const query = request.query as Record<string, unknown>;
    const listFilters = pickListFilters(query, CUSTOMER_LIST_FILTER_KEYS);
    const selectableOnly = isSelectableOnlyQuery(query);
    return await customersService.list(
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
    const customer = await customersService.findById(tenantId, id);
    if (!customer) {
      return sendNotFound(reply, 'Cliente não encontrado');
    }
    return customer;
  });

  app.post('/', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const body = request.body as Record<string, unknown>;
    const parsed = customerSchema.safeParse({
      ...body,
      connections: extractConnections(body),
    });
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }
    try {
      return await customersService.create(tenantId, {
        ...parsed.data,
        tagIds: extractTagIds(body),
      });
    } catch (error) {
      return sendApiError(reply, error);
    }
  });

  app.put('/:id', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const parsed = customerSchema.safeParse({
      ...body,
      connections: extractConnections(body),
    });
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }
    try {
      return await customersService.update(tenantId, id, {
        ...parsed.data,
        tagIds: extractTagIds(body),
      });
    } catch (error) {
      return sendApiError(reply, error);
    }
  });

  app.patch('/:id/deactivate', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };
    try {
      return await customersService.deactivate(tenantId, id);
    } catch (error) {
      return sendApiError(reply, error);
    }
  });

  app.patch('/:id/activate', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };
    try {
      return await customersService.activate(tenantId, id);
    } catch (error) {
      return sendApiError(reply, error);
    }
  });
}
