import { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { loginSchema } from '@client-manager/shared';
import { sendApiError, sendValidationError } from '../../core/errors/send-api-error';
import { AuthService } from './auth.service';

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
        type: 'tenant_user',
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
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        return sendValidationError(reply, err);
      }
      return sendApiError(reply, err);
    }
  });

  app.post('/change-password', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { newPassword } = request.body as { newPassword: string };
      const userId = (request.user as any).sub;
      await authService.changePassword(userId, newPassword);
      return { message: 'Senha atualizada com sucesso' };
    } catch (err: unknown) {
      return sendApiError(reply, err);
    }
  });

  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).sub;
    return await authService.getProfile(userId);
  });

  app.patch('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const data = request.body as { name?: string; email?: string; password?: string };
    try {
      return await authService.updateProfile(userId, data);
    } catch (err: unknown) {
      return sendApiError(reply, err);
    }
  });
}

// Add decorator to Fastify for authentication
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
    authenticateAdmin: any;
  }
}
