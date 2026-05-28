import { prisma } from '../../core/database';
import argon2 from 'argon2';
import { RegisterInput } from '@iptv-manager/shared';
import slugify from 'slugify';

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.accountUser.findUnique({
      where: { email },
      include: { account: true },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    return user;
  }

  async changePassword(userId: string, newPassword: string) {
    const passwordHash = await argon2.hash(newPassword);
    return await prisma.accountUser.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordResetRequired: false,
      },
    });
  }
}
