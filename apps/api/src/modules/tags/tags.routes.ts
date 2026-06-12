import { FastifyInstance } from 'fastify';
import { TagsService } from './tags.service';
import { tagSchema } from '@client-manager/shared';
import { requireTenantId } from '../../core/middleware/require-tenant';
import { sendApiError, sendValidationError } from '../../core/errors/send-api-error';

const tagsService = new TagsService();

export async function tagsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { page, pageSize, filter, scope } = request.query as {
      page?: string;
      pageSize?: string;
      filter?: string;
      scope?: 'customer' | 'server';
    };

    return await tagsService.list(
      tenantId,
      parseInt(page || '1', 10),
      parseInt(pageSize || '100', 10),
      filter || '',
      scope,
    );
  });

  app.get('/search', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { q } = request.query as { q?: string };
    return await tagsService.search(tenantId, q || '');
  });

  app.post('/find-or-create', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { name } = request.body as { name: string };
    try {
      return await tagsService.findOrCreate(tenantId, name);
    } catch (error) {
      return sendApiError(reply, error);
    }
  });

  app.post('/', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const parsed = tagSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }
    try {
      return await tagsService.create(tenantId, parsed.data);
    } catch (error) {
      return sendApiError(reply, error);
    }
  });

  app.put('/:id', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };
    const parsed = tagSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }
    try {
      return await tagsService.update(tenantId, id, parsed.data);
    } catch (error) {
      return sendApiError(reply, error);
    }
  });

  app.delete('/:id', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };
    try {
      return await tagsService.delete(tenantId, id);
    } catch (error) {
      return sendApiError(reply, error);
    }
  });
}
