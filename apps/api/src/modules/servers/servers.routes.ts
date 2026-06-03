import { FastifyInstance } from 'fastify';
import { ServersService } from './servers.service';
import { serverSchema } from '@client-manager/shared';
import { requireTenantId } from '../../core/middleware/require-tenant';
import { pickListFilters } from '../../core/utils/parse-list-filters';
import { isSelectableOnlyQuery } from '../../core/utils/parse-selectable-only';

const SERVER_LIST_FILTER_KEYS = ['status'] as const;

const serversService = new ServersService();

function extractTagIds(body: Record<string, unknown>): string[] | undefined {
  if (!Array.isArray(body.tagIds)) return undefined;
  return body.tagIds.filter((id): id is string => typeof id === 'string');
}

/** Credentials are merged from raw body so they are not dropped by an outdated shared build. */
function extractServerCredentials(body: Record<string, unknown>) {
  const hasUsername = Object.prototype.hasOwnProperty.call(body, 'panelUsername');
  const hasPassword = Object.prototype.hasOwnProperty.call(body, 'panelPassword');

  return {
    ...(hasUsername
      ? {
          panelUsername:
            typeof body.panelUsername === 'string' && body.panelUsername.trim()
              ? body.panelUsername.trim()
              : undefined,
        }
      : {}),
    ...(hasPassword
      ? {
          panelPassword:
            typeof body.panelPassword === 'string' ? body.panelPassword : undefined,
        }
      : {}),
  };
}

export async function serversRoutes(app: FastifyInstance) {
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
    const listFilters = pickListFilters(query, SERVER_LIST_FILTER_KEYS);
    const selectableOnly = isSelectableOnlyQuery(query);
    return await serversService.list(
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
    const server = await serversService.findById(tenantId, id);
    if (!server) {
      return reply.status(404).send({ message: 'Server not found' });
    }
    return server;
  });

  app.post('/', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const body = request.body as Record<string, unknown>;
    const parsed = serverSchema.safeParse(body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: parsed.error.errors[0]?.message ?? 'Dados do servidor inválidos',
      });
    }
    return await serversService.create(tenantId, {
      ...parsed.data,
      ...extractServerCredentials(body),
      tagIds: extractTagIds(body),
    });
  });

  app.put('/:id', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const parsed = serverSchema.safeParse(body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: parsed.error.errors[0]?.message ?? 'Dados do servidor inválidos',
      });
    }
    const updated = await serversService.update(tenantId, id, {
      ...parsed.data,
      ...extractServerCredentials(body),
      tagIds: extractTagIds(body),
    });
    return updated;
  });

  app.patch('/:id/deactivate', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };
    return await serversService.deactivate(tenantId, id);
  });

  app.patch('/:id/activate', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };
    return await serversService.activate(tenantId, id);
  });
}
