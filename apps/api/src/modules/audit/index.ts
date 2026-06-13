import type { FastifyInstance } from 'fastify';
import { auditRoutes } from './audit.routes';

export async function registerAuditModule(app: FastifyInstance) {
  await app.register(auditRoutes, { prefix: '/api' });
}
