import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const paidNoPayment = await prisma.invoice.count({
    where: { status: 'paid', payments: { none: {} } },
  });
  const paymentNotPaid = await prisma.payment.count({
    where: { invoice: { status: { not: 'paid' } } },
  });
  const amountMismatch = await prisma.$queryRaw<{ c: bigint }[]>`
    SELECT COUNT(*)::bigint as c FROM payments pay
    JOIN invoices i ON i.id = pay."invoiceId"
    WHERE pay."amountCents" != i."amountCents"
  `;
  const byStatus = await prisma.invoice.groupBy({ by: ['status'], _count: true });
  const paidWithPay = await prisma.invoice.count({
    where: { status: 'paid', payments: { some: {} } },
  });
  const openWithPay = await prisma.invoice.count({
    where: { status: { in: ['open', 'overdue'] }, payments: { some: {} } },
  });
  const paidCount = await prisma.invoice.count({ where: { status: 'paid' } });
  const totalPay = await prisma.payment.count();
  const totalInv = await prisma.invoice.count();

  console.log(
    JSON.stringify(
      {
        totalInv,
        totalPay,
        byStatus,
        paidCount,
        paidWithPay,
        paidNoPayment,
        openOrOverdueWithPayment: openWithPay,
        paymentOnNonPaidInvoice: paymentNotPaid,
        amountMismatch: Number(amountMismatch[0]?.c ?? 0),
        aligned:
          paidNoPayment === 0 &&
          paymentNotPaid === 0 &&
          openWithPay === 0 &&
          Number(amountMismatch[0]?.c ?? 0) === 0 &&
          paidWithPay === paidCount,
      },
      null,
      2,
    ),
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
