import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEEP_ADMIN_EMAIL = 'admin@iptvmanager.com';

async function main() {
  const admin = await prisma.platformAdmin.findUnique({ where: { email: KEEP_ADMIN_EMAIL } });
  if (!admin) {
    throw new Error(`Platform admin not found: ${KEEP_ADMIN_EMAIL}`);
  }

  const accounts = await prisma.account.findMany({
    select: { id: true, name: true, slug: true },
  });

  console.log(`Keeping only platform admin: ${KEEP_ADMIN_EMAIL}`);
  console.log(`Removing ${accounts.length} account(s) and all tenant users...`);

  await prisma.$transaction(async (tx) => {
    await tx.connectionRenewalTask.deleteMany();
    await tx.payment.deleteMany();
    await tx.invoice.deleteMany();
    await tx.connection.deleteMany();
    await tx.customer.deleteMany();
    await tx.plan.deleteMany();
    await tx.server.deleteMany();
    await tx.tag.deleteMany();

    const users = await tx.accountUser.deleteMany();
    console.log(`Deleted tenant users: ${users.count}`);

    for (const account of accounts) {
      await tx.account.delete({ where: { id: account.id } });
      console.log(`Deleted account: ${account.name} (${account.slug})`);
    }
  });

  const summary = {
    admins: await prisma.platformAdmin.count(),
    accounts: await prisma.account.count(),
    users: await prisma.accountUser.count(),
    customers: await prisma.customer.count(),
    plans: await prisma.plan.count(),
    servers: await prisma.server.count(),
    invoices: await prisma.invoice.count(),
    payments: await prisma.payment.count(),
    activations: await prisma.connectionRenewalTask.count(),
    tags: await prisma.tag.count(),
  };

  console.log('\nReset complete. Remaining records:');
  console.log(JSON.stringify(summary, null, 2));

  const remainingAdmin = await prisma.platformAdmin.findUnique({ where: { email: KEEP_ADMIN_EMAIL } });
  console.log(`\nPreserved admin: ${remainingAdmin?.email}`);
}

main()
  .catch((error) => {
    console.error('Reset failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
