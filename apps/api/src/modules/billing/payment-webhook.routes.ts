import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { mapErrorToApiResponse } from '../../core/errors/api-error.mapper';
import { PaymentWebhookService } from './payment-webhook.service';
import { PaymentWebhookLogService } from './payment-webhook-log.service';
import {
  buildWebhookRequestSummary,
  PaymentWebhookTrace,
} from './payment-webhook-trace';
import { decodeWebhookTenantRef, extractMercadoPagoPaymentId } from './payment-webhook.util';

const paymentWebhookService = new PaymentWebhookService();
const paymentWebhookLogService = new PaymentWebhookLogService();

function normalizeHeaders(
  headers: FastifyRequest['headers'],
): Record<string, string | string[] | undefined> {
  const normalized: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(headers)) {
    normalized[key.toLowerCase()] = value;
  }
  return normalized;
}

async function safeRecordLog(input: Parameters<PaymentWebhookLogService['record']>[0]) {
  try {
    await paymentWebhookLogService.record(input);
  } catch (error) {
    console.error('[webhook-log] failed to persist log', error);
  }
}

async function handleWebhook(request: FastifyRequest, reply: FastifyReply) {
  const tenantId = decodeWebhookTenantRef((request.params as { tenantId: string }).tenantId);
  const query = request.query as Record<string, unknown>;
  const headers = normalizeHeaders(request.headers);
  const trace = new PaymentWebhookTrace();
  const requestSummary = buildWebhookRequestSummary({
    httpMethod: request.method,
    body: request.body,
    query,
    headers,
  });

  trace.add(`received:${request.method}`);
  trace.add(`tenant_ref:${tenantId}`);

  const paymentIdHint = extractMercadoPagoPaymentId(request.body, query);

  try {
    const result = await paymentWebhookService.handleMercadoPago({
      tenantId,
      body: request.body,
      query,
      headers,
      trace,
    });

    const outcome = resolveOutcome(result);
    const detail = trace.toDetail({
      request: requestSummary,
      result,
    });

    request.log.info({ tenantId, outcome, paymentId: paymentIdHint }, 'webhook processed');

    await safeRecordLog({
      tenantRef: tenantId,
      httpMethod: request.method,
      paymentId: extractPaymentIdFromResult(result) ?? paymentIdHint,
      statusCode: 200,
      outcome,
      detail: JSON.stringify(detail),
    });

    return reply.status(200).send(result);
  } catch (error) {
    const mapped = mapErrorToApiResponse(error);
    const message = mapped.body.message;
    const status = mapped.statusCode;

    trace.add(`error:${message}`);
    const detail = trace.toDetail({
      request: requestSummary,
      query,
      body: request.body,
    });

    request.log.warn({ tenantId, status, message, paymentId: paymentIdHint }, 'webhook failed');

    await safeRecordLog({
      tenantRef: tenantId,
      httpMethod: request.method,
      paymentId: paymentIdHint,
      statusCode: status,
      outcome: 'error',
      errorMessage: message,
      detail: JSON.stringify(detail),
    });

    return reply.status(status).send({
      ok: false,
      message,
      code: mapped.body.code,
    });
  }
}

function resolveOutcome(result: Record<string, unknown>): string {
  if (result.ok === false) return 'error';
  if (result.ignored) return 'ignored';
  if (result.idempotent) return 'idempotent';
  return 'success';
}

function extractPaymentIdFromResult(result: Record<string, unknown>): string | null {
  if (typeof result.paymentId === 'string') return result.paymentId;
  if (typeof result.providerPaymentId === 'string') return result.providerPaymentId;
  return null;
}

/**
 * Public webhook routes for PSP payment notifications.
 */
export async function paymentWebhookRoutes(app: FastifyInstance) {
  app.post('/payment/:tenantId/mercadopago', handleWebhook);
  app.get('/payment/:tenantId/mercadopago', handleWebhook);
}
