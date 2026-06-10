import { prisma } from '../../core/database';
import {
  DEFAULT_CHARGE_MESSAGE_DELAY_MS,
  DEFAULT_CHARGE_MESSAGE_TEMPLATES,
  DEFAULT_ONE_OFF_CHARGE_MESSAGE_TEMPLATES,
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
 * @creationDate 10/06/2026
 * Copyright (c) 2026 NTT DATA Brasil Consultologia de Negócio e Tecnologia da Informação Ltda.
 * Todos os direitos reservados.
 */
export class TenantChargeMessageService {
  /**
   * Returns subscription and one-off charge message templates for the tenant.
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
   * Updates subscription and one-off charge message templates for the tenant.
   */
  async update(
    tenantId: string,
    input: TenantChargeMessagesSettingsInput,
  ): Promise<TenantChargeMessagesSettingsDto> {
    const row = await prisma.tenantBillingAutomationConfig.upsert({
      where: { accountId: tenantId },
      create: {
        accountId: tenantId,
        chargeMessageTemplates: input.subscription.templates,
        oneOffMessageTemplates: input.oneOff.templates,
        chargeMessageDelayMs: input.subscription.delayMs,
      },
      update: {
        chargeMessageTemplates: input.subscription.templates,
        oneOffMessageTemplates: input.oneOff.templates,
        chargeMessageDelayMs: input.subscription.delayMs,
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
  };
}
