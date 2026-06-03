import { prisma } from '../database';
import {
  ENTITY_ACTIVE_STATUS,
  ENTITY_INACTIVE_STATUS,
  isSelectableCustomerStatus,
} from '@client-manager/shared';

export async function assertSelectablePlan(tenantId: string, planId: string | null | undefined) {
  if (!planId) return;
  const plan = await prisma.plan.findFirst({ where: { id: planId, tenantId } });
  if (!plan || plan.status !== ENTITY_ACTIVE_STATUS) {
    throw new Error('Plano indisponível ou desativado');
  }
}

export async function assertSelectableServers(tenantId: string, serverIds: string[]) {
  if (serverIds.length === 0) return;
  const servers = await prisma.server.findMany({
    where: { id: { in: serverIds }, tenantId },
    select: { id: true, status: true },
  });
  if (servers.length !== serverIds.length) {
    throw new Error('Servidor não encontrado');
  }
  const inactive = servers.find((server) => server.status !== ENTITY_ACTIVE_STATUS);
  if (inactive) {
    throw new Error('Servidor indisponível ou desativado');
  }
}

export function assertSelectableCustomerStatus(status: string) {
  if (!isSelectableCustomerStatus(status)) {
    throw new Error('Cliente desativado');
  }
}

export async function assertCustomerSelectable(tenantId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId },
    select: { status: true },
  });
  if (!customer) {
    throw new Error('Cliente não encontrado');
  }
  if (customer.status === ENTITY_INACTIVE_STATUS) {
    throw new Error('Cliente desativado');
  }
}
