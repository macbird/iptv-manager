import type { BillingScope } from '@prisma/client';
import { prisma } from '../../core/database';
import { safeDecryptCredential } from '../../core/crypto/credential-crypto';
import {
  isMercadoPagoPaymentApproved,
  resolveMercadoPagoPaymentForWebhook,
} from '../../integrations/payment/mercadopago-payment.client';
import { verifyMercadoPagoWebhookSignature } from './mercadopago-webhook-signature.util';
import { PaymentConfirmationService } from './payment-confirmation.service';
import { PaymentWebhookTrace } from './payment-webhook-trace';
import { extractMercadoPagoPaymentId } from './payment-webhook.util';

const paymentConfirmation = new PaymentConfirmationService();

type WebhookScope = BillingScope;

interface WebhookContext {
  scope: WebhookScope;
  accountId: string | null;
  accessToken: string;
  webhookSecret: string | null;
}

export interface MercadoPagoWebhookInput {
  tenantId: string;
  body: unknown;
  query: Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
  trace: PaymentWebhookTrace;
}

/**
 * Processes Mercado Pago payment webhooks and confirms invoice payment.
 */
export class PaymentWebhookService {
  /**
   * Handles Mercado Pago webhook notifications for a tenant or the platform.
   */
  async handleMercadoPago(params: MercadoPagoWebhookInput): Promise<Record<string, unknown>> {
    const context = await this.resolveContext(params.tenantId, params.trace);
    this.assertMercadoPagoSignature(context, params);

    const paymentId = extractMercadoPagoPaymentId(params.body, params.query);
    params.trace.add(
      paymentId ? `payment_id_extracted:${paymentId}` : 'payment_id_missing',
    );
    if (!paymentId) {
      return { ok: true, ignored: true, reason: 'missing_payment_id' };
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { providerPaymentId: paymentId },
    });
    if (existingPayment) {
      params.trace.add(`idempotent_existing_payment:${existingPayment.id}`);
      return { ok: true, idempotent: true, paymentId: existingPayment.id };
    }

    const invoiceHint = await this.findInvoice(context, paymentId, null);
    params.trace.add(invoiceHint ? `invoice_hint:${invoiceHint.id}` : 'invoice_hint_not_found');

    const mpPayment = await resolveMercadoPagoPaymentForWebhook(context.accessToken, {
      paymentId,
      externalReference: invoiceHint?.id ?? null,
      expectedAmountCents: invoiceHint?.amountCents,
    });
    params.trace.add(`mp_status:${mpPayment.status}`);
    if (!isMercadoPagoPaymentApproved(mpPayment.status)) {
      return { ok: true, ignored: true, status: mpPayment.status, providerPaymentId: mpPayment.id };
    }

    const invoice = await this.findInvoice(context, mpPayment.id, mpPayment.externalReference);
    if (!invoice) {
      params.trace.add('invoice_not_found_after_mp_lookup');
      return { ok: true, ignored: true, reason: 'invoice_not_found', paymentId: mpPayment.id };
    }

    if (invoice.status === 'paid') {
      params.trace.add(`invoice_already_paid:${invoice.id}`);
      return { ok: true, idempotent: true, invoiceId: invoice.id };
    }

    if (mpPayment.transactionAmountCents !== invoice.amountCents) {
      params.trace.add('amount_mismatch');
      return {
        ok: false,
        error: 'amount_mismatch',
        expected: invoice.amountCents,
        received: mpPayment.transactionAmountCents,
      };
    }

    const result = await paymentConfirmation.confirm({
      invoiceId: invoice.id,
      tenantId: context.scope === 'tenant' ? invoice.accountId : undefined,
      scope: context.scope,
      amountCents: invoice.amountCents,
      method: 'pix',
      source: 'webhook',
      providerPaymentId: mpPayment.id,
      paidAt: mpPayment.paidAt ?? new Date(),
      notes: 'Mercado Pago webhook',
    });

    params.trace.add(`payment_confirmed:${invoice.id}`);
    return { ok: true, ...result };
  }

  private async resolveContext(
    tenantRef: string,
    trace: PaymentWebhookTrace,
  ): Promise<WebhookContext> {
    if (tenantRef === 'platform') {
      const config = await prisma.platformPaymentConfig.findUnique({ where: { id: 'default' } });
      if (!config?.apiKey) {
        throw new Error('Platform payment credentials not configured');
      }
      trace.add('context:platform');
      return {
        scope: 'platform',
        accountId: null,
        accessToken: safeDecryptCredential(config.apiKey) || config.apiKey,
        webhookSecret: this.resolveWebhookSecret(config.webhookToken),
      };
    }

    const account = await prisma.account.findFirst({
      where: {
        OR: [
          { id: tenantRef },
          { slug: tenantRef },
          { slug: tenantRef.replace(/%20/g, ' ') },
        ],
      },
    });
    if (!account) {
      trace.add('context:tenant_not_found');
      throw new Error('Tenant not found');
    }

    const credential = await prisma.tenantPaymentCredential.findUnique({
      where: {
        accountId_provider: { accountId: account.id, provider: 'mercadopago' },
      },
    });

    if (!credential?.active || !credential.apiKey) {
      trace.add('context:mercadopago_not_configured');
      throw new Error('Mercado Pago credentials not configured for tenant');
    }

    trace.add(`context:tenant:${account.id}`);
    return {
      scope: 'tenant',
      accountId: account.id,
      accessToken: safeDecryptCredential(credential.apiKey) || credential.apiKey,
      webhookSecret: this.resolveWebhookSecret(credential.webhookToken),
    };
  }

  private resolveWebhookSecret(stored: string | null | undefined): string | null {
    if (!stored) return null;
    return safeDecryptCredential(stored) || stored;
  }

  private assertMercadoPagoSignature(
    context: WebhookContext,
    params: MercadoPagoWebhookInput,
  ): void {
    const paymentId = extractMercadoPagoPaymentId(params.body, params.query);
    if (!paymentId) {
      params.trace.add('signature:skipped_no_payment_id');
      return;
    }

    const xSignature = params.headers['x-signature'];
    const xRequestId = params.headers['x-request-id'];

    const signatureResult = verifyMercadoPagoWebhookSignature({
      secret: context.webhookSecret ?? '',
      xSignature: typeof xSignature === 'string' ? xSignature : undefined,
      xRequestId: typeof xRequestId === 'string' ? xRequestId : undefined,
      dataId: paymentId,
    });

    if (signatureResult.skipped) {
      params.trace.add('signature:skipped_no_secret');
      return;
    }

    if (!signatureResult.valid) {
      params.trace.add(`signature:invalid:${signatureResult.reason ?? 'unknown'}`);
      throw new Error(`Invalid Mercado Pago webhook signature (${signatureResult.reason})`);
    }

    params.trace.add('signature:valid');
  }

  private async findInvoice(
    context: WebhookContext,
    providerChargeId: string,
    externalReference: string | null,
  ) {
    return prisma.invoice.findFirst({
      where: {
        scope: context.scope,
        ...(context.accountId ? { accountId: context.accountId } : {}),
        OR: [
          { providerChargeId },
          ...(externalReference ? [{ id: externalReference }] : []),
        ],
      },
    });
  }
}
