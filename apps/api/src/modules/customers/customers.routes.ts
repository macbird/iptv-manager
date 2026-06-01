import { FastifyInstance } from 'fastify';
import { CustomersService } from './customers.service';
import { customerSchema } from '@client-manager/shared';

const customersService = new CustomersService();

export async function customersRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async (request) => {
    const { page, pageSize, filter } = request.query as { page?: string, pageSize?: string, filter?: string };
    return await customersService.list(
      request.tenantId!, 
      parseInt(page || '1'), 
      parseInt(pageSize || '10'), 
      filter || ''
    );
  });

  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return await customersService.findById(request.tenantId!, id);
  });

  app.post('/', async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    const data = customerSchema.parse(body);
    return await customersService.create(request.tenantId, { ...data, tagIds: body.tagIds });
  });

  app.put('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const data = customerSchema.parse(body);
    return await customersService.update(request.tenantId!, id, { ...data, tagIds: body.tagIds });
  });

  app.delete('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return await customersService.delete(request.tenantId!, id);
  });
}
