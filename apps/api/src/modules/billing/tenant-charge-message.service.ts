import { prisma } from '../../core/database';
import { toPrismaInputJson } from '../../core/database/prisma-json.util';
import {
  DEFAULT_CHARGE_MESSAGE_DELAY_MS,
  DEFAULT_CHARGE_MESSAGE_TEMPLATES,
  DEFAULT_ONE_OFF_CHARGE_MESSAGE_TEMPLATES,
  buildDefaultOverdueChargeMessages,
  extractOverdueReminderDays,
  parseOverdueChargeMessages,
  serializeOverdueChargeMessages,
  type ChargeMessageSettingsDto,
  type TenantChargeMessagesSettingsDto,
  type TenantChargeMessagesSettingsInput,
  parseChargeMessageTemplates,
} from '@client-manager/shared';

/**
 * Loads and updates tenant charge WhatsApp message templates.
 *
 * @author João Paulo da Silva
 * @since 4.9.0
 * @creationDate 12/06/2026

 */
export class TenantChargeMessageService {
  /**
   * Returns subscription, one-off, and overdue charge message templates for the tenant.
   */
  async get(tenantId: string): Promise<TenantChargeMessagesSettingsDto> {
    const row = await this.ensureRow(tenantId);
    return mapTenantChargeMessages(row);
  }

  /**
   * Returns subscription templates (legacy shape for charge message loader).
   */
  async getSubscription(tenantId: string): Promise<ChargeMessageSettingsDto> {
    const row = await this.ensureRow(tenantId);
    return {
      templates: parseChargeMessageTemplates(row.chargeMessageTemplates, DEFAULT_CHARGE_MESSAGE_TEMPLATES),
      delayMs: row.chargeMessageDelayMs ?? DEFAULT_CHARGE_MESSAGE_DELAY_MS,
    };
  }

  /**
   * Updates subscription, one-off, and overdue charge message templates for the tenant.
   */
  async update(
    tenantId: string,
    input: TenantChargeMessagesSettingsInput,
  ): Promise<TenantChargeMessagesSettingsDto> {
    const overdueReminderDays = extractOverdueReminderDays(input.overdue);

    const row = await prisma.tenantBillingAutomationConfig.upsert({
      where: { accountId: tenantId },
      create: {
        accountId: tenantId,
        chargeMessageTemplates: toPrismaInputJson(input.subscription.templates),
        oneOffMessageTemplates: toPrismaInputJson(input.oneOff.templates),
        chargeMessageDelayMs: input.subscription.delayMs,
        overdueMessageTemplates: toPrismaInputJson(serializeOverdueChargeMessages(input.overdue)),
        overdueReminderDays,
      },
      update: {
        chargeMessageTemplates: toPrismaInputJson(input.subscription.templates),
        oneOffMessageTemplates: toPrismaInputJson(input.oneOff.templates),
        chargeMessageDelayMs: input.subscription.delayMs,
        overdueMessageTemplates: toPrismaInputJson(serializeOverdueChargeMessages(input.overdue)),
        overdueReminderDays,
      },
    });

    return mapTenantChargeMessages(row);
  }

  private async ensureRow(tenantId: string) {
    return prisma.tenantBillingAutomationConfig.upsert({
      where: { accountId: tenantId },
      create: { accountId: tenantId },
      update: {},
    });
  }
}

function mapTenantChargeMessages(row: {
  chargeMessageTemplates: unknown;
  oneOffMessageTemplates: unknown;
  chargeMessageDelayMs: number;
  overdueMessageTemplates?: unknown;
}): TenantChargeMessagesSettingsDto {
  const delayMs = row.chargeMessageDelayMs ?? DEFAULT_CHARGE_MESSAGE_DELAY_MS;
  return {
    subscription: {
      templates: parseChargeMessageTemplates(row.chargeMessageTemplates, DEFAULT_CHARGE_MESSAGE_TEMPLATES),
      delayMs,
    },
    oneOff: {
      templates: parseChargeMessageTemplates(
        row.oneOffMessageTemplates,
        DEFAULT_ONE_OFF_CHARGE_MESSAGE_TEMPLATES,
      ),
      delayMs,
    },
    overdue: parseOverdueChargeMessages(row.overdueMessageTemplates ?? buildDefaultOverdueChargeMessages()),
  };
}
