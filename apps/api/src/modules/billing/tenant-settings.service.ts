import { isEnabledPaymentProvider } from '@client-manager/shared';
import { prisma } from '../../core/database';
import type { PaymentProviderType, WhatsAppProviderType } from '@prisma/client';
import { safeDecryptCredential } from '../../core/crypto/credential-crypto';
import { TenantPaymentSettingsService } from './tenant-payment-settings.service';
import { TenantChargeMessageService } from './tenant-charge-message.service';
import { TenantBillingAutomationService } from './tenant-billing-automation.service';
import { buildMercadoPagoWebhookUrl } from './payment-webhook.util';

const tenantPaymentSettings = new TenantPaymentSettingsService();
const tenantChargeMessageService = new TenantChargeMessageService();
const tenantBillingAutomationService = new TenantBillingAutomationService();

export class TenantSettingsService {
  async getSubscription(tenantId: string) {
    const sub = await prisma.accountSubscription.findUnique({
      where: { accountId: tenantId },
      include: { platformPlan: true },
    });

    if (!sub) {
      return null;
    }

    const now = new Date();
    let due = new Date(now.getFullYear(), now.getMonth(), sub.dueDay);
    if (due < now) {
      due = new Date(now.getFullYear(), now.getMonth() + 1, sub.dueDay);
    }

    return {
      planName: sub.platformPlan.name,
      priceCents: sub.platformPlan.priceCents,
      billingCycle: sub.platformPlan.billingCycle,
      dueDay: sub.dueDay,
      status: sub.status,
      nextDueDate: due.toISOString(),
    };
  }

  async get(tenantId: string) {
    const [account, payment, whatsapp, paymentCredentials, paymentRouting] = await Promise.all([
      prisma.account.findUnique({ where: { id: tenantId }, select: { slug: true } }),
      prisma.tenantPaymentConfig.findUnique({ where: { accountId: tenantId } }),
      prisma.tenantWhatsappConfig.findUnique({ where: { accountId: tenantId } }),
      tenantPaymentSettings.listCredentials(tenantId),
      tenantPaymentSettings.listRoutingRules(tenantId),
    ]);

    const mercadoPagoCredential = paymentCredentials.find((item) => item.provider === 'mercadopago');
    const mercadoPagoWebhookToken = await this.resolveMercadoPagoWebhookToken(
      tenantId,
      mercadoPagoCredential?.webhookTokenConfigured,
    );

    const legacyProviderWarning =
      paymentCredentials.some((item) => item.active && !isEnabledPaymentProvider(item.provider)) ||
      paymentRouting.some(
        (rule) => rule.active !== false && !isEnabledPaymentProvider(rule.provider),
      );

    return {
      accountSlug: account?.slug ?? null,
      legacyProviderWarning,
      mercadoPagoWebhookUrl: buildMercadoPagoWebhookUrl(tenantId),
      mercadoPagoWebhookRequiresToken: Boolean(mercadoPagoCredential?.webhookTokenConfigured),
      payment: {
        provider: payment?.provider ?? 'mercadopago',
        apiKeyConfigured: Boolean(payment?.apiKey),
        webhookTokenConfigured: Boolean(payment?.webhookToken),
      },
      paymentCredentials,
      paymentRouting,
      whatsapp: {
        provider: whatsapp?.provider ?? 'evolution',
        instanceUrl: whatsapp?.instanceUrl ?? null,
        apiKeyConfigured: Boolean(whatsapp?.apiKey),
        connectionStatus: whatsapp?.connectionStatus ?? 'disconnected',
        wabaId: whatsapp?.wabaId ?? null,
        phoneNumberId: whatsapp?.phoneNumberId ?? null,
        displayPhoneNumber: whatsapp?.displayPhoneNumber ?? null,
        tokenExpiresAt: whatsapp?.tokenExpiresAt?.toISOString() ?? null,
      },
      subscription: await this.getSubscription(tenantId),
      chargeMessages: await tenantChargeMessageService.get(tenantId),
      billingAutomation: await tenantBillingAutomationService.get(tenantId),
    };
  }

  async update(
    tenantId: string,
    data: {
      paymentProvider?: PaymentProviderType;
      paymentApiKey?: string;
      paymentWebhookToken?: string;
      whatsappProvider?: WhatsAppProviderType;
      whatsappInstanceUrl?: string;
      whatsappApiKey?: string;
    },
  ) {
    const paymentUpdate: Record<string, unknown> = { accountId: tenantId };
    if (data.paymentProvider !== undefined) {
      if (!isEnabledPaymentProvider(data.paymentProvider)) {
        throw new Error(
          `O provedor "${data.paymentProvider}" não está disponível. Use Mercado Pago.`,
        );
      }
      paymentUpdate.provider = data.paymentProvider;
    }
    if (data.paymentApiKey !== undefined && data.paymentApiKey !== '')
      paymentUpdate.apiKey = data.paymentApiKey;
    if (data.paymentWebhookToken !== undefined && data.paymentWebhookToken !== '')
      paymentUpdate.webhookToken = data.paymentWebhookToken;

    if (
      data.paymentProvider !== undefined ||
      (data.paymentApiKey !== undefined && data.paymentApiKey !== '') ||
      (data.paymentWebhookToken !== undefined && data.paymentWebhookToken !== '')
    ) {
      await prisma.tenantPaymentConfig.upsert({
        where: { accountId: tenantId },
        create: paymentUpdate as { accountId: string; provider: PaymentProviderType },
        update: paymentUpdate,
      });
    }

    const whatsappUpdate: Record<string, unknown> = { accountId: tenantId };
    if (data.whatsappProvider !== undefined) whatsappUpdate.provider = data.whatsappProvider;
    if (data.whatsappInstanceUrl !== undefined)
      whatsappUpdate.instanceUrl = data.whatsappInstanceUrl || null;
    if (data.whatsappApiKey !== undefined && data.whatsappApiKey !== '')
      whatsappUpdate.apiKey = data.whatsappApiKey;

    if (
      data.whatsappProvider !== undefined ||
      data.whatsappInstanceUrl !== undefined ||
      (data.whatsappApiKey !== undefined && data.whatsappApiKey !== '')
    ) {
      await prisma.tenantWhatsappConfig.upsert({
        where: { accountId: tenantId },
        create: whatsappUpdate as { accountId: string; provider: WhatsAppProviderType },
        update: whatsappUpdate,
      });
    }

    return this.get(tenantId);
  }

  private async resolveMercadoPagoWebhookToken(
    tenantId: string,
    configured?: boolean,
  ): Promise<string | null> {
    if (!configured) return null;
    const row = await prisma.tenantPaymentCredential.findUnique({
      where: {
        accountId_provider: { accountId: tenantId, provider: 'mercadopago' },
      },
    });
    if (!row?.webhookToken) return null;
    return safeDecryptCredential(row.webhookToken) || row.webhookToken;
  }
}
