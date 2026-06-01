import { FastifyInstance } from 'fastify';
import { dashboardRoutes } from './dashboard.routes';

export async function registerDashboardModule(app: FastifyInstance) {
  await app.register(dashboardRoutes);
}
