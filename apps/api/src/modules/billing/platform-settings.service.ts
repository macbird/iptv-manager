import { assertEnabledPaymentProvider } from '@client-manager/shared';
import { prisma } from '../../core/database';
import type { PaymentProviderType, WhatsAppProviderType } from '@prisma/client';
import { PlatformBillingAutomationService } from './platform-billing-automation.service';

const CONFIG_ID = 'default';
const platformBillingAutomationService = new PlatformBillingAutomationService();

export class PlatformSettingsService {
  async get() {
    const [plan, payment, whatsapp, automationSettings] = await Promise.all([
      prisma.platformPlan.findFirst({ where: { isDefault: true, active: true } }),
      prisma.platformPaymentConfig.findUnique({ where: { id: CONFIG_ID } }),
      prisma.platformWhatsappConfig.findUnique({ where: { id: CONFIG_ID } }),
      platformBillingAutomationService.getSettings(),
    ]);

    const defaultPlan =
      plan ??
      (await prisma.platformPlan.create({
        data: {
          name: 'Padrão',
          priceCents: 4990,
          isDefault: true,
          active: true,
        },
      }));

    const paymentConfig =
      payment ??
      (await prisma.platformPaymentConfig.create({
        data: { id: CONFIG_ID },
      }));

    const whatsappConfig =
      whatsapp ??
      (await prisma.platformWhatsappConfig.create({
        data: { id: CONFIG_ID },
      }));

    return {
      defaultPlan: {
        id: defaultPlan.id,
        name: defaultPlan.name,
        priceCents: defaultPlan.priceCents,
        billingCycle: defaultPlan.billingCycle,
      },
      payment: {
        provider: paymentConfig.provider,
        apiKeyConfigured: Boolean(paymentConfig.apiKey),
        webhookTokenConfigured: Boolean(paymentConfig.webhookToken),
        overdueDays: paymentConfig.overdueDays,
      },
      whatsapp: {
        provider: whatsappConfig.provider,
        instanceUrl: whatsappConfig.instanceUrl,
        apiKeyConfigured: Boolean(whatsappConfig.apiKey),
        connectionStatus: whatsappConfig.connectionStatus,
        wabaId: whatsappConfig.wabaId,
        phoneNumberId: whatsappConfig.phoneNumberId,
        displayPhoneNumber: whatsappConfig.displayPhoneNumber,
        tokenExpiresAt: whatsappConfig.tokenExpiresAt?.toISOString() ?? null,
      },
      chargeMessages: automationSettings.chargeMessages,
      billingAutomation: automationSettings.billingAutomation,
    };
  }

  async update(data: {
    planName?: string;
    priceCents?: number;
    paymentProvider?: PaymentProviderType;
    paymentApiKey?: string;
    paymentWebhookToken?: string;
    overdueDays?: number;
    whatsappProvider?: WhatsAppProviderType;
    whatsappInstanceUrl?: string;
    whatsappApiKey?: string;
  }) {
    const plan = await prisma.platformPlan.findFirst({ where: { isDefault: true } });
    if (plan && (data.planName !== undefined || data.priceCents !== undefined)) {
      await prisma.platformPlan.update({
        where: { id: plan.id },
        data: {
          ...(data.planName !== undefined ? { name: data.planName } : {}),
          ...(data.priceCents !== undefined ? { priceCents: data.priceCents } : {}),
        },
      });
    }

    const paymentUpdate: Record<string, unknown> = {};
    if (data.paymentProvider !== undefined) {
      assertEnabledPaymentProvider(data.paymentProvider);
      paymentUpdate.provider = data.paymentProvider;
    }
    if (data.paymentApiKey !== undefined && data.paymentApiKey !== '')
      paymentUpdate.apiKey = data.paymentApiKey;
    if (data.paymentWebhookToken !== undefined && data.paymentWebhookToken !== '')
      paymentUpdate.webhookToken = data.paymentWebhookToken;
    if (data.overdueDays !== undefined) paymentUpdate.overdueDays = data.overdueDays;

    if (Object.keys(paymentUpdate).length > 0) {
      await prisma.platformPaymentConfig.upsert({
        where: { id: CONFIG_ID },
        create: { id: CONFIG_ID, ...paymentUpdate },
        update: paymentUpdate,
      });
    }

    const whatsappUpdate: Record<string, unknown> = {};
    if (data.whatsappProvider !== undefined) whatsappUpdate.provider = data.whatsappProvider;
    if (data.whatsappInstanceUrl !== undefined)
      whatsappUpdate.instanceUrl = data.whatsappInstanceUrl || null;
    if (data.whatsappApiKey !== undefined && data.whatsappApiKey !== '')
      whatsappUpdate.apiKey = data.whatsappApiKey;

    if (Object.keys(whatsappUpdate).length > 0) {
      await prisma.platformWhatsappConfig.upsert({
        where: { id: CONFIG_ID },
        create: { id: CONFIG_ID, ...whatsappUpdate },
        update: whatsappUpdate,
      });
    }

    return this.get();
  }
}
