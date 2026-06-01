
import { prisma } from '../core/database';
import argon2 from 'argon2';

async function resetAdminPassword() {
  const email = 'admin@clientemanager.com';
  const newPassword = 'admin123';

  const admin = await prisma.platformAdmin.findUnique({ where: { email } });
  if (!admin) {
    console.error('Admin not found');
    process.exit(1);
  }

  const hashedPassword = await argon2.hash(newPassword);
  await prisma.platformAdmin.update({
    where: { id: admin.id },
    data: { password: hashedPassword },
  });

  console.log('Password updated successfully');
  process.exit(0);
}

resetAdminPassword();
