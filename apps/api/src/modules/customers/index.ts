import { FastifyInstance } from 'fastify';
import { customersRoutes } from './customers.routes';

export async function registerCustomersModule(app: FastifyInstance) {
  app.register(customersRoutes);
}
