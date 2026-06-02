import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function currentCycleKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function clearActivationSeedData() {
  await prisma.connectionRenewalTask.deleteMany();
}

async function seedAutomationConfig(accountId: string) {
  await prisma.tenantBillingAutomationConfig.upsert({
    where: { accountId },
    create: {
      accountId,
      daysBeforeDue: 3,
      sendWhatsapp: true,
      sendPaymentCharge: true,
      active: true,
    },
    update: {
      daysBeforeDue: 3,
      active: true,
    },
  });
}

async function createPaidInvoiceWithActivations(params: {
  accountId: string;
  customerId: string;
  amountCents: number;
  billingCycleKey: string;
  method: string;
  notes: string;
  completeAllTasks: boolean;
  completeSomeTasks: boolean;
  expiresInDays: number;
}) {
  const dueDate = daysFromNow(params.expiresInDays);

  let invoice = await prisma.invoice.findFirst({
    where: {
      scope: 'tenant',
      accountId: params.accountId,
      customerId: params.customerId,
      billingCycleKey: params.billingCycleKey,
      status: { not: 'canceled' },
    },
  });

  if (!invoice) {
    invoice = await prisma.invoice.create({
      data: {
        scope: 'tenant',
        accountId: params.accountId,
        customerId: params.customerId,
        billingCycleKey: params.billingCycleKey,
        amountCents: params.amountCents,
        dueDate,
        status: 'paid',
        paidAt: new Date(),
        paymentProvider: 'asaas',
        pixCopyPaste: `SEEDPIX${params.customerId.slice(0, 8)}`,
        providerChargeId: `seed_${params.customerId.slice(0, 8)}_${params.billingCycleKey}`,
      },
    });
  } else {
    invoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'paid', paidAt: new Date() },
    });
  }

  const existingPayment = await prisma.payment.findFirst({
    where: { invoiceId: invoice.id },
  });

  const payment =
    existingPayment ??
    (await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amountCents: params.amountCents,
        method: params.method,
        source: params.method === 'pix' ? 'webhook' : 'manual',
        notes: params.notes,
        providerPaymentId: `seed_pay_${invoice.id.slice(0, 8)}`,
        paidAt: new Date(),
      },
    }));

  await prisma.customer.update({
    where: { id: params.customerId },
    data: { expiresAt: dueDate },
  });

  const connections = await prisma.connection.findMany({
    where: { customerId: params.customerId },
  });

  const tasks = [];
  for (let i = 0; i < connections.length; i++) {
    const connection = connections[i];
    let status: 'pending' | 'completed' = 'pending';
    let completedAt: Date | null = null;

    if (params.completeAllTasks) {
      status = 'completed';
      completedAt = new Date();
    } else if (params.completeSomeTasks && i === 0) {
      status = 'completed';
      completedAt = new Date();
    }

    const task = await prisma.connectionRenewalTask.create({
      data: {
        tenantId: params.accountId,
        customerId: params.customerId,
        connectionId: connection.id,
        paymentId: payment.id,
        invoiceId: invoice.id,
        status,
        paidAt: payment.paidAt,
        completedAt,
        notes: status === 'completed' ? 'Renovado no servidor (seed)' : null,
      },
    });
    tasks.push(task);
  }

  if (params.completeAllTasks) {
    const customer = await prisma.customer.findUnique({
      where: { id: params.customerId },
      include: { plan: true },
    });
    if (customer?.plan) {
      const base = new Date();
      const next = new Date(base);
      switch (customer.plan.billingCycle) {
        case 'quarterly':
          next.setMonth(next.getMonth() + 3);
          break;
        case 'yearly':
          next.setFullYear(next.getFullYear() + 1);
          break;
        default:
          next.setMonth(next.getMonth() + 1);
      }
      await prisma.customer.update({
        where: { id: params.customerId },
        data: { expiresAt: next },
      });
    }
  }

  return { invoice, payment, tasks };
}

async function main() {
  console.log('Seeding Ativações pendentes (connection renewal tasks)...');
  await clearActivationSeedData();

  const cycleKey = currentCycleKey();
  const accounts = await prisma.account.findMany({
    include: {
      customers: {
        include: {
          plan: true,
          connections: true,
        },
      },
    },
  });

  if (accounts.length === 0) {
    console.error('No accounts found. Run customer/infrastructure seeds first.');
    process.exit(1);
  }

  let taskCount = 0;

  for (const account of accounts) {
    await seedAutomationConfig(account.id);

    const withConnections = account.customers.filter((c) => c.connections.length > 0);
    if (withConnections.length === 0) {
      console.warn(`Account ${account.slug}: no customers with connections, skipping.`);
      continue;
    }

    const scenarios = [
      {
        label: 'pendentes — vence em 2 dias (automação D-3)',
        completeAllTasks: false,
        completeSomeTasks: false,
        expiresInDays: 2,
        method: 'pix',
        notes: 'Pagamento PIX confirmado — aguardando ativação no servidor',
      },
      {
        label: 'parcial — 1 conexão já ativada',
        completeAllTasks: false,
        completeSomeTasks: withConnections[1]?.connections.length > 1,
        expiresInDays: 1,
        method: 'cash',
        notes: 'Cliente pagou em dinheiro após cobrança gerada',
      },
      {
        label: 'concluídas — vencimento já estendido',
        completeAllTasks: true,
        completeSomeTasks: false,
        expiresInDays: -5,
        method: 'transfer',
        notes: 'Pagamento antecipado registrado manualmente',
      },
    ] as const;

    for (let i = 0; i < Math.min(scenarios.length, withConnections.length); i++) {
      const customer = withConnections[i];
      const scenario = scenarios[i];
      const amountCents = customer.plan
        ? Math.round(Number(customer.plan.price) * 100)
        : 3500;

      const result = await createPaidInvoiceWithActivations({
        accountId: account.id,
        customerId: customer.id,
        amountCents,
        billingCycleKey: `${cycleKey}-seed-${i + 1}`,
        method: scenario.method,
        notes: scenario.notes,
        completeAllTasks: scenario.completeAllTasks,
        completeSomeTasks: scenario.completeSomeTasks,
        expiresInDays: scenario.expiresInDays,
      });

      taskCount += result.tasks.length;
      console.log(
        `  [${account.slug}] ${customer.name}: ${result.tasks.length} tarefa(s) — ${scenario.label}`,
      );
    }

    if (withConnections.length > scenarios.length) {
      const extra = withConnections[scenarios.length];
      const result = await createPaidInvoiceWithActivations({
        accountId: account.id,
        customerId: extra.id,
        amountCents: extra.plan ? Math.round(Number(extra.plan.price) * 100) : 4200,
        billingCycleKey: `${cycleKey}-seed-open`,
        method: 'pix',
        notes: 'Webhook PSP — ativações pendentes',
        completeAllTasks: false,
        completeSomeTasks: false,
        expiresInDays: 3,
      });
      taskCount += result.tasks.length;
      console.log(`  [${account.slug}] ${extra.name}: ${result.tasks.length} tarefa(s) — vence em 3 dias`);
    }
  }

  const pending = await prisma.connectionRenewalTask.count({ where: { status: 'pending' } });
  const completed = await prisma.connectionRenewalTask.count({ where: { status: 'completed' } });

  console.log(`Done: ${taskCount} tasks (${pending} pending, ${completed} completed).`);
  console.log('Open /activations in the app to review "Ativações pendentes".');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
