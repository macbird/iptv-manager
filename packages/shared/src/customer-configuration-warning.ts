import { ENTITY_INACTIVE_STATUS } from './entity-lifecycle';

export interface CustomerConfigurationWarning {
  inactivePlan: boolean;
  inactiveServerConnection: boolean;
}

export function buildCustomerConfigurationWarning(params: {
  planStatus?: string | null;
  serverStatuses: string[];
}): CustomerConfigurationWarning {
  return {
    inactivePlan: params.planStatus === ENTITY_INACTIVE_STATUS,
    inactiveServerConnection: params.serverStatuses.some(
      (status) => status === ENTITY_INACTIVE_STATUS,
    ),
  };
}

export function hasCustomerConfigurationWarning(
  warning: CustomerConfigurationWarning,
): boolean {
  return warning.inactivePlan || warning.inactiveServerConnection;
}

export function getCustomerConfigurationWarningMessage(
  warning: CustomerConfigurationWarning,
): string | null {
  const parts: string[] = [];
  if (warning.inactivePlan) {
    parts.push('plano desativado');
  }
  if (warning.inactiveServerConnection) {
    parts.push('conexão com servidor desativado');
  }
  if (parts.length === 0) {
    return null;
  }
  return `Configuração inconsistente: ${parts.join(' e ')}.`;
}

export interface CustomerConfigurationWarningSource {
  plan?: { name: string; status: string } | null;
  connections?: Array<{ server?: { name: string; status: string } | null }>;
}

/**
 * Detailed explanations for the customer edit form (plan/server names when available).
 */
export function getCustomerConfigurationWarningDetails(
  source: CustomerConfigurationWarningSource,
): string[] {
  const messages: string[] = [];

  if (source.plan?.status === ENTITY_INACTIVE_STATUS) {
    messages.push(
      `O plano "${source.plan.name}" está desativado. Escolha outro plano ou reative este em Planos.`,
    );
  }

  const inactiveServerNames = new Set<string>();
  for (const connection of source.connections ?? []) {
    const server = connection.server;
    if (!server || server.status !== ENTITY_INACTIVE_STATUS) {
      continue;
    }
    inactiveServerNames.add(server.name);
  }

  for (const serverName of inactiveServerNames) {
    messages.push(
      `Uma conexão usa o servidor "${serverName}" desativado. Altere o servidor ou reative-o em Servidores.`,
    );
  }

  return messages;
}
