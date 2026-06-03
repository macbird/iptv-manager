import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [activations, payments, invoices] = await prisma.$transaction([
    prisma.connectionRenewalTask.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.invoice.deleteMany(),
  ]);

  console.log('Billing data cleared:');
  console.log(
    JSON.stringify(
      {
        activations: activations.count,
        payments: payments.count,
        invoices: invoices.count,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error('Clear billing failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
