import type { FastifyInstance } from 'fastify';
import { API_ERROR_CODES, metaEmbeddedSignupSchema } from '@client-manager/shared';
import { requireTenantId } from '../../core/middleware/require-tenant';
import { sendApiError, sendValidationError } from '../../core/errors/send-api-error';
import { MetaEmbeddedSignupService } from '../../integrations/whatsapp/meta/meta-embedded-signup.service';
import { getMetaPlatformConfig } from '../../integrations/whatsapp/meta/meta-whatsapp.config';

const metaSignupService = new MetaEmbeddedSignupService();

/**
 * Tenant Meta WhatsApp routes (Tech Provider / Embedded Signup).
 */
export async function tenantWhatsappMetaRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/settings/whatsapp/meta/config', async (_request, reply) => {
    try {
      return metaSignupService.getPublicConfig();
    } catch (error) {
      return sendApiError(reply, error);
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
      return sendValidationError(reply, parsed.error);
    }

    try {
      return await metaSignupService.completeSignup('tenant', tenantId, parsed.data);
    } catch (error) {
      return sendApiError(reply, error);
    }
  });

  app.post('/settings/whatsapp/meta/disconnect', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    try {
      return await metaSignupService.disconnect('tenant', tenantId);
    } catch (error) {
      return sendApiError(reply, error);
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

    return reply.status(403).send({
      message: 'Falha na verificação do webhook',
      code: API_ERROR_CODES.NOT_ALLOWED,
    });
  });

  app.post('/webhooks/whatsapp/meta', async (request, reply) => {
    // Delivery status and inbound messages — extend as needed.
    app.log.info({ webhook: request.body }, 'Meta WhatsApp webhook event');
    return reply.status(200).send({ received: true });
  });
}
