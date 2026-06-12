import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Deactivates one plan and one server still linked to active customers
 * so the customer list shows configuration warnings in the UI.
 */
async function main() {
  const account = await prisma.account.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (!account) {
    console.error('Nenhuma conta encontrada. Rode o seed de infraestrutura antes.');
    process.exit(1);
  }

  const customers = await prisma.customer.findMany({
    where: { tenantId: account.id, status: 'active' },
    include: {
      plan: { select: { id: true, name: true, status: true } },
      connections: {
        include: { server: { select: { id: true, name: true, status: true } } },
      },
    },
    orderBy: { name: 'asc' },
    take: 10,
  });

  if (customers.length < 2) {
    console.error('São necessários ao menos 2 clientes ativos para simular os avisos.');
    process.exit(1);
  }

  const planWarningCustomer = customers.find((customer) => customer.planId && customer.plan);
  const serverWarningCustomer = customers.find(
    (customer) =>
      customer.id !== planWarningCustomer?.id && customer.connections.some((c) => c.server),
  );

  if (!planWarningCustomer?.planId || !planWarningCustomer.plan) {
    console.error('Nenhum cliente com plano encontrado.');
    process.exit(1);
  }

  const connectionWithServer = serverWarningCustomer?.connections.find((c) => c.server);
  if (!serverWarningCustomer || !connectionWithServer?.server) {
    console.error('Nenhum cliente com conexão em servidor encontrado.');
    process.exit(1);
  }

  await prisma.plan.update({
    where: { id: planWarningCustomer.planId },
    data: { status: 'inactive' },
  });

  await prisma.server.update({
    where: { id: connectionWithServer.serverId },
    data: { status: 'inactive' },
  });

  console.log('Avisos de configuração simulados:');
  console.log(
    `  • Plano desativado: "${planWarningCustomer.plan.name}" (cliente: ${planWarningCustomer.name})`,
  );
  console.log(
    `  • Servidor desativado: "${connectionWithServer.server.name}" (cliente: ${serverWarningCustomer.name})`,
  );
  console.log('');
  console.log('Abra /customers no tenant para ver o ícone de alerta.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
