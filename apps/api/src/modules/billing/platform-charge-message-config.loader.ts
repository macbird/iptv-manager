import { prisma } from '../../core/database';
import {
  buildChargeMessagesFromTemplates,
  DEFAULT_CHARGE_MESSAGE_DELAY_MS,
  DEFAULT_PLATFORM_SAAS_CHARGE_MESSAGE_TEMPLATES,
  parseChargeMessageTemplates,
  type ChargeMessageTemplateContext,
} from '@client-manager/shared';

const CONFIG_ID = 'default';

/**
 * Loads platform SaaS charge message templates for WhatsApp sends to tenants.
 *
 * @author João Paulo da Silva
 * @since 4.9.0
 * @creationDate 12/06/2026

 */
export class PlatformChargeMessageConfigLoader {
  /**
   * Returns rendered SaaS charge messages for a platform-scope invoice.
   */
  async buildMessages(context: ChargeMessageTemplateContext): Promise<{
    messages: string[];
    delayMs: number;
  }> {
    const row = await prisma.platformBillingAutomationConfig.findUnique({
      where: { id: CONFIG_ID },
    });

    const templates = parseChargeMessageTemplates(
      row?.chargeMessageTemplates,
      DEFAULT_PLATFORM_SAAS_CHARGE_MESSAGE_TEMPLATES,
    );
    const delayMs = row?.chargeMessageDelayMs ?? DEFAULT_CHARGE_MESSAGE_DELAY_MS;
    const messages = buildChargeMessagesFromTemplates(templates, context);

    return { messages, delayMs };
  }
}
