import type { FastifyInstance } from 'fastify';
import {
  evolutionConnectSchema,
  evolutionTestMessageSchema,
} from '@client-manager/shared';
import { requireTenantId } from '../../core/middleware/require-tenant';
import { sendApiError, sendValidationError } from '../../core/errors/send-api-error';
import { EvolutionConnectionService } from '../../integrations/whatsapp/evolution/evolution-connection.service';

const evolutionService = new EvolutionConnectionService();

/**
 * Tenant Evolution WhatsApp routes (connect, status, test message).
 */
export async function tenantWhatsappEvolutionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.get('/settings/whatsapp/evolution/connection', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    try {
      return await evolutionService.getConnection(tenantId);
    } catch (error) {
      return sendApiError(reply, error);
    }
  });

  app.post('/settings/whatsapp/evolution/connect', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const parsed = evolutionConnectSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }

    try {
      return await evolutionService.startConnect(tenantId, parsed.data.phone);
    } catch (error) {
      return sendApiError(reply, error);
    }
  });

  app.post('/settings/whatsapp/evolution/disconnect', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    try {
      return await evolutionService.disconnect(tenantId);
    } catch (error) {
      return sendApiError(reply, error);
    }
  });

  app.post('/settings/whatsapp/evolution/test-message', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const parsed = evolutionTestMessageSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }

    try {
      return await evolutionService.sendTestMessage(
        tenantId,
        parsed.data.phone,
        parsed.data.text,
      );
    } catch (error) {
      return sendApiError(reply, error);
    }
  });
}
