import { FastifyInstance } from 'fastify';
import { AuthService } from './auth.service';
import { loginSchema, registerSchema } from '@iptv-manager/shared';

const authService = new AuthService();

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);
      const user = await authService.login(email, password);

      const token = app.jwt.sign({
        sub: user.id,
        tenantId: user.accountId,
        role: user.role,
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          passwordResetRequired: user.passwordResetRequired
        },
        account: {
          id: user.account.id,
          name: user.account.name,
          slug: user.account.slug,
        },
        token
      };
    } catch (err: any) {
      return reply.status(401).send({ message: 'Invalid credentials' });
    }
  });

  app.post('/change-password', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { newPassword } = request.body as { newPassword: string };
      const userId = (request.user as any).sub;
      await authService.changePassword(userId, newPassword);
      return { message: 'Password updated successfully' };
    } catch (err: any) {
      return reply.status(400).send({ message: err.message });
    }
  });

  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    return request.user;
  });
}

// Add decorator to Fastify for authentication
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
  }
}
