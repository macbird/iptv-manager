import { FastifyInstance } from 'fastify';
import { activationsRoutes } from './activations.routes';

export async function registerActivationsModule(app: FastifyInstance) {
  await app.register(activationsRoutes, { prefix: '/api' });
}
