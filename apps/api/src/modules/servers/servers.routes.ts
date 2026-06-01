import { FastifyInstance } from 'fastify';
import { ServersService } from './servers.service';
import { serverSchema } from '@client-manager/shared';

const serversService = new ServersService();

export async function serversRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async (request) => {
    const { page, pageSize, filter } = request.query as { page?: string, pageSize?: string, filter?: string };
    return await serversService.list(
      request.tenantId!, 
      parseInt(page || '1'), 
      parseInt(pageSize || '10'), 
      filter || ''
    );
  });

  app.post('/', async (request) => {
    const body = request.body as Record<string, unknown>;
    const data = serverSchema.parse(body);
    return await serversService.create(request.tenantId!, { ...data, tagIds: body.tagIds });
  });

  app.put('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const data = serverSchema.parse(body);
    return await serversService.update(request.tenantId!, id, { ...data, tagIds: body.tagIds });
  });

  app.delete('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return await serversService.delete(request.tenantId!, id);
  });
}
