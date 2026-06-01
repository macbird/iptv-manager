import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const account = await prisma.account.findFirst();
  if (!account) {
    console.error('No account found');
    return;
  }

  // 1. Cleanup
  await prisma.connection.deleteMany({});
  await prisma.server.deleteMany({});
  await prisma.plan.deleteMany({});

  // 2. Create Plans
  const plans = [];
  for (let i = 1; i <= 4; i++) {
    plans.push(await prisma.plan.create({
      data: { name: `Plano ${i}`, price: 30 + i * 5, billingCycle: 'monthly', maxConnections: i, tenantId: account.id }
    }));
  }

  // 3. Create Servers
  const servers = [];
  for (let i = 1; i <= 10; i++) {
    servers.push(await prisma.server.create({
      data: { name: `Servidor ${i}`, panelUrl: `http://server${i}.com`, tenantId: account.id }
    }));
  }

  // 4. Update Customers
  const customers = await prisma.customer.findMany();
  for (const customer of customers) {
    const randomPlan = plans[Math.floor(Math.random() * plans.length)];
    const randomServer = servers[Math.floor(Math.random() * servers.length)];
    
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        planId: randomPlan.id,
        connections: {
          create: [
            {
              serverId: randomServer.id,
              macAddress: 'AA:BB:CC:DD:EE:FF',
              applicationName: 'Smarters Player',
              label: 'Principal'
            }
          ]
        }
      }
    });
  }
  console.log('Infrastructure seeded and customers updated');
}

main().finally(() => prisma.$disconnect());
