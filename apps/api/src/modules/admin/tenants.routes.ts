import { FastifyInstance } from 'fastify';
import { TenantsService } from './tenants.service';

const tenantsService = new TenantsService();

export async function tenantsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticateAdmin);

  app.get('/', async () => {
    return await tenantsService.list();
  });

  app.post('/', async (request) => {
    const data = request.body as { name: string, slug?: string, ownerEmail: string, ownerName: string, initialPassword?: string };
    return await tenantsService.create(data);
  });

  app.post('/reset-password', async (request) => {
    const { email, newPassword } = request.body as { email: string, newPassword?: string };
    return await tenantsService.resetPassword(email, newPassword);
  });

  app.patch('/:id/status', async (request) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: 'active' | 'suspended' };
    return await tenantsService.toggleStatus(id, status);
  });
}
