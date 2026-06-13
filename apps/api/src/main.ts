import './load-env';
import path from 'path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import { registerAuthModule } from './modules/auth';
import { registerPlansModule } from './modules/plans';
import { registerServersModule } from './modules/servers';
import { registerCustomersModule } from './modules/customers';
import { registerTagsModule } from './modules/tags';
import { registerDashboardModule } from './modules/dashboard';
import { registerAdminModule } from './modules/admin';
import { registerBillingModule } from './modules/billing';
import { paymentWebhookRoutes } from './modules/billing/payment-webhook.routes';
import { registerActivationsModule } from './modules/activations';
import { registerAuditModule } from './modules/audit';
import { startBillingScheduler } from './modules/billing/billing-scheduler';
import { tenantContextMiddleware } from './core/middleware/tenant-context';
import { prisma } from './core/database';
import { API_ERROR_CODES } from '@client-manager/shared';
import { mapErrorToApiResponse } from './core/errors/api-error.mapper';
import { sendUnauthorized } from './core/errors/send-api-error';

const app = Fastify({
  logger: true,
});

const start = async () => {
  try {
    await app.register(cors, {
      origin: true,
    });

    await app.register(jwt, {
      secret: process.env.JWT_SECRET || 'supersecret',
    });

    app.decorate("authenticate", async (request: any, reply: any) => {
      try {
        await request.jwtVerify();
        const user = request.user as any;
        if (user.type !== 'tenant_user' && user.type !== 'platform_admin') {
          throw new Error('Unauthorized');
        }
        if (user.type === 'tenant_user') {
          await tenantContextMiddleware(request, reply);
        }
      } catch (err) {
        sendUnauthorized(reply);
      }
    });

    app.decorate("authenticateAdmin", async (request: any, reply: any) => {
      try {
        await request.jwtVerify();
        const user = request.user as any;
        if (user.type !== 'platform_admin') {
          throw new Error('Unauthorized');
        }
      } catch (err) {
        return sendUnauthorized(reply);
      }
    });

    // Health check (DB included — P0.2)
    app.get('/health', async (_request, reply) => {
      const { APP_VERSION } = await import('@client-manager/shared');
      let db: 'ok' | 'fail' = 'fail';
      let dbMessage: string | undefined;

      try {
        await prisma.$queryRaw`SELECT 1`;
        db = 'ok';
      } catch (error) {
        dbMessage = error instanceof Error ? error.message : String(error);
      }

      const payload = {
        status: db === 'ok' ? 'ok' : 'degraded',
        version: APP_VERSION,
        db,
        ...(dbMessage ? { dbMessage } : {}),
        gitSha: process.env.DEPLOY_GIT_SHA ?? null,
        deployedAt: process.env.DEPLOYED_AT ?? null,
      };

      return reply.status(db === 'ok' ? 200 : 503).send(payload);
    });

    app.get('/health/db', async () => {
      try {
        const users = await prisma.accountUser.count();
        const maskedUrl = (process.env.DATABASE_URL || '').replace(/:([^:@/]+)@/, ':***@');
        return { ok: true, users, nodeEnv: process.env.NODE_ENV, databaseUrl: maskedUrl };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : String(error),
        };
      }
    });

    // Register modules
    await app.register(registerAuthModule, { prefix: '/api/auth' });
    await app.register(registerPlansModule, { prefix: '/api/plans' });
    await app.register(registerServersModule, { prefix: '/api/servers' });
    await app.register(registerCustomersModule, { prefix: '/api/customers' });
    await app.register(registerTagsModule, { prefix: '/api/tags' });
    await app.register(registerDashboardModule, { prefix: '/api/dashboard' });
    await app.register(registerAdminModule, { prefix: '/api/admin' });
    await registerBillingModule(app);
    await app.register(paymentWebhookRoutes, { prefix: '/api/webhooks' });
    await registerActivationsModule(app);
    await registerAuditModule(app);

    app.setErrorHandler((error, request, reply) => {
      const mapped = mapErrorToApiResponse(error);
      if (mapped.statusCode >= 500) {
        request.log.error({ err: error, code: mapped.body.code }, mapped.body.message);
      }
      return reply.status(mapped.statusCode).send(mapped.body);
    });

    // Serve static files (Frontend)
    const webDistPath = path.join(process.cwd(), 'apps/web/dist');
    await app.register(fastifyStatic, {
      root: webDistPath,
      prefix: '/',
      wildcard: false,
    });

    // Handle SPA routing
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api')) {
        reply.code(404).send({ message: 'Recurso não encontrado', code: API_ERROR_CODES.NOT_FOUND });
        return;
      }
      reply.sendFile('index.html');
    });

    const port = process.env.NODE_ENV === 'production' ? 80 : (Number(process.env.PORT) || 3001);

    await app.listen({ port, host: '0.0.0.0' });
    startBillingScheduler();
    console.log('Registered routes:', app.printRoutes());
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
