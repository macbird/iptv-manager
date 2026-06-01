import { prisma } from '../core/database';
import argon2 from 'argon2';

async function resetUserPassword() {
  const email = 'test_final@example.com';
  const newPassword = '12345678';

  const user = await prisma.accountUser.findUnique({ where: { email } });
  if (!user) {
    console.error('User not found');
    process.exit(1);
  }

  const hashedPassword = await argon2.hash(newPassword);
  await prisma.accountUser.update({
    where: { id: user.id },
    data: { 
      passwordHash: hashedPassword,
      passwordResetRequired: false
    },
  });

  console.log('User password updated successfully');
  process.exit(0);
}

resetUserPassword();
