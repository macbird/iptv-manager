import { FastifyInstance } from 'fastify';
import { AdminAuthService } from './admin-auth.service';

const adminAuthService = new AdminAuthService();

export async function adminAuthRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    try {
      const { email, password } = request.body as any;
      const admin = await adminAuthService.login(email, password);

      const token = app.jwt.sign({
        sub: admin.id,
        type: 'platform_admin',
      });

      return { token };
    } catch (err: any) {
      return reply.status(401).send({ message: 'Invalid credentials' });
    }
  });

  app.get('/me', { preHandler: [app.authenticateAdmin] }, async (request) => {
    const adminId = (request.user as any).sub;
    return await adminAuthService.getProfile(adminId);
  });

  app.patch('/me', { preHandler: [app.authenticateAdmin] }, async (request) => {
    const adminId = (request.user as any).sub;
    const data = request.body as { email?: string, password?: string };
    return await adminAuthService.updateProfile(adminId, data);
  });
}
