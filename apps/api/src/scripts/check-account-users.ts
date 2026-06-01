import { prisma } from '../core/database';

async function checkAccountUsers() {
  const accounts = await prisma.account.findMany({
    include: { users: true },
  });
  console.log('Accounts with users:', JSON.stringify(accounts, null, 2));
}

checkAccountUsers().finally(() => prisma.$disconnect());
