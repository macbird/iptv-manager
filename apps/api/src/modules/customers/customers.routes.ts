import { FastifyInstance } from 'fastify';
import { CustomersService } from './customers.service';
import { customerSchema } from '@client-manager/shared';
import { requireTenantId } from '../../core/middleware/require-tenant';
import { pickListFilters } from '../../core/utils/parse-list-filters';
import { isSelectableOnlyQuery } from '../../core/utils/parse-selectable-only';

const CUSTOMER_LIST_FILTER_KEYS = [
  'status',
  'planId',
  'expiresFrom',
  'expiresTo',
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
      return reply.status(404).send({ message: 'Customer not found' });
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
      return reply.status(400).send({
        message: parsed.error.errors[0]?.message ?? 'Dados do cliente inválidos',
      });
    }
    try {
      return await customersService.create(tenantId, {
        ...parsed.data,
        tagIds: extractTagIds(body),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar cliente';
      return reply.status(400).send({ message });
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
      return reply.status(400).send({
        message: parsed.error.errors[0]?.message ?? 'Dados do cliente inválidos',
      });
    }
    try {
      return await customersService.update(tenantId, id, {
        ...parsed.data,
        tagIds: extractTagIds(body),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar cliente';
      return reply.status(400).send({ message });
    }
  });

  app.patch('/:id/deactivate', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };
    try {
      return await customersService.deactivate(tenantId, id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao desativar cliente';
      return reply.status(404).send({ message });
    }
  });

  app.patch('/:id/activate', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };
    try {
      return await customersService.activate(tenantId, id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao reativar cliente';
      return reply.status(404).send({ message });
    }
  });
}
