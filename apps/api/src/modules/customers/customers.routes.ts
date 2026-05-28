import { FastifyInstance } from 'fastify';
import { CustomersService } from './customers.service';
import { customerSchema } from '@iptv-manager/shared';

const customersService = new CustomersService();

export async function customersRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async (request) => {
    return await customersService.list(request.tenantId!);
  });

  app.post('/', async (request, reply) => {
    const data = customerSchema.parse(request.body);
    return await customersService.create(request.tenantId!, data);
  });

  app.put('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const data = customerSchema.parse(request.body);
    return await customersService.update(request.tenantId!, id, data);
  });

  app.delete('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return await customersService.delete(request.tenantId!, id);
  });
}
