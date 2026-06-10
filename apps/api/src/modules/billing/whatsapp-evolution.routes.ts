import type { FastifyInstance } from 'fastify';
import {
  evolutionConnectSchema,
  evolutionTestMessageSchema,
} from '@client-manager/shared';
import { requireTenantId } from '../../core/middleware/require-tenant';
import { EvolutionConnectionService } from '../../integrations/whatsapp/evolution/evolution-connection.service';
import { EvolutionWhatsAppError } from '../../integrations/whatsapp/evolution/evolution-whatsapp.errors';

const evolutionService = new EvolutionConnectionService();

function handleEvolutionError(error: unknown) {
  if (error instanceof EvolutionWhatsAppError) {
    const status =
      error.code === 'NOT_CONFIGURED' ? 503 : error.code === 'NOT_CONNECTED' ? 409 : 400;
    return { status, body: { message: error.message, code: error.code } };
  }

  return {
    status: 500,
    body: {
      message: error instanceof Error ? error.message : 'Erro interno Evolution WhatsApp',
    },
  };
}

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
      const handled = handleEvolutionError(error);
      return reply.status(handled.status).send(handled.body);
    }
  });

  app.post('/settings/whatsapp/evolution/connect', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const parsed = evolutionConnectSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({
        message: parsed.error.errors[0]?.message ?? 'Dados de conexão inválidos',
      });
    }

    try {
      return await evolutionService.startConnect(tenantId, parsed.data.phone);
    } catch (error) {
      const handled = handleEvolutionError(error);
      return reply.status(handled.status).send(handled.body);
    }
  });

  app.post('/settings/whatsapp/evolution/disconnect', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    try {
      return await evolutionService.disconnect(tenantId);
    } catch (error) {
      const handled = handleEvolutionError(error);
      return reply.status(handled.status).send(handled.body);
    }
  });

  app.post('/settings/whatsapp/evolution/test-message', async (request, reply) => {
    const tenantId = requireTenantId(request, reply);
    if (!tenantId) return;

    const parsed = evolutionTestMessageSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({
        message: parsed.error.errors[0]?.message ?? 'Dados de teste inválidos',
      });
    }

    try {
      return await evolutionService.sendTestMessage(
        tenantId,
        parsed.data.phone,
        parsed.data.text,
      );
    } catch (error) {
      const handled = handleEvolutionError(error);
      return reply.status(handled.status).send(handled.body);
    }
  });
}
