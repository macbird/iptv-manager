import { prisma } from '../core/database';

async function checkAdmin() {
  const admin = await prisma.platformAdmin.findUnique({
    where: { email: 'admin@clientemanager.com' },
  });
  console.log('Admin found:', admin);
}

checkAdmin().finally(() => prisma.$disconnect());
