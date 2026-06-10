import { FastifyInstance } from 'fastify';
import { platformBillingRoutes } from './platform-billing.routes';
import { tenantBillingRoutes } from './tenant-billing.routes';
import { metaWhatsappWebhookRoutes, tenantWhatsappMetaRoutes } from './whatsapp-meta.routes';
import { tenantWhatsappEvolutionRoutes } from './whatsapp-evolution.routes';

export async function registerBillingModule(app: FastifyInstance) {
  await app.register(tenantBillingRoutes, { prefix: '/api' });
  await app.register(tenantWhatsappMetaRoutes, { prefix: '/api' });
  await app.register(tenantWhatsappEvolutionRoutes, { prefix: '/api' });
  await app.register(metaWhatsappWebhookRoutes, { prefix: '/api' });
}

export async function registerPlatformBillingModule(app: FastifyInstance) {
  await app.register(platformBillingRoutes);
}
