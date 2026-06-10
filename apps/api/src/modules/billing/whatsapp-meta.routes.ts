import type { FastifyInstance } from 'fastify';
import { metaEmbeddedSignupSchema } from '@client-manager/shared';
import { requireTenantId } from '../../core/middleware/require-tenant';
import { MetaEmbeddedSignupService } from '../../integrations/whatsapp/meta/meta-embedded-signup.service';
import { MetaWhatsAppError } from '../../integrations/whatsapp/meta/meta-whatsapp.errors';
import { getMetaPlatformConfig } from '../../integrations/whatsapp/meta/meta-whatsapp.config';

const metaSignupService = new MetaEmbeddedSignupService();

function handleMetaError(error: unknown) {
  if (error instanceof MetaWhatsAppError) {
    const status = error.code === 'NOT_CONFIGURED' ? 503 : 400;
    return { status, body: { message: error.message, code: error.code } };
  }
  return {
    status: 500,
    body: { message: error instanceof Error ? error.message : 'Erro interno Meta WhatsApp' },
  };
}

/**
 * Tenant Meta WhatsApp routes (Tech Provider / Embedded Signup).
 */
export async function tenantWhatsappMetaRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/settings/whatsapp/meta/config', async (_request, reply) => {
    try {
      return metaSignupService.getPublicConfig();
    } catch (error) {
      const handled = handleMetaError(error);
      return reply.status(handled.status).send(handled.body);
    }
  });

  app.get('/settings/whatsapp/meta/connection', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;
    return metaSignupService.getConnection('tenant', tenantId);
  });

  app.post('/settings/whatsapp/meta/connect', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const parsed = metaEmbeddedSignupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: parsed.error.errors[0]?.message ?? 'Dados de conexão Meta inválidos',
      });
    }

    try {
      return await metaSignupService.completeSignup('tenant', tenantId, parsed.data);
    } catch (error) {
      const handled = handleMetaError(error);
      return reply.status(handled.status).send(handled.body);
    }
  });

  app.post('/settings/whatsapp/meta/disconnect', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    try {
      return await metaSignupService.disconnect('tenant', tenantId);
    } catch (error) {
      const handled = handleMetaError(error);
      return reply.status(handled.status).send(handled.body);
    }
  });
}

/**
 * Meta webhook (verification + inbound events). No JWT — secured by verify token + Meta signature (future).
 */
export async function metaWhatsappWebhookRoutes(app: FastifyInstance) {
  app.get('/webhooks/whatsapp/meta', async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    const platform = getMetaPlatformConfig();
    if (mode === 'subscribe' && token && challenge && platform?.webhookVerifyToken === token) {
      return reply.status(200).send(challenge);
    }

    return reply.status(403).send({ message: 'Webhook verification failed' });
  });

  app.post('/webhooks/whatsapp/meta', async (request, reply) => {
    // Delivery status and inbound messages — extend as needed.
    app.log.info({ webhook: request.body }, 'Meta WhatsApp webhook event');
    return reply.status(200).send({ received: true });
  });
}
