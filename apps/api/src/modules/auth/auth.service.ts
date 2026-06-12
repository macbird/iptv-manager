import { prisma } from '../../core/database';
import argon2 from 'argon2';
import { API_ERROR_CODES, ApiBusinessError } from '@client-manager/shared';

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.accountUser.findUnique({
      where: { email },
      include: { account: true },
    });

    if (!user) {
      throw new ApiBusinessError('Credenciais inválidas', API_ERROR_CODES.UNAUTHORIZED, 401);
    }

    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      throw new ApiBusinessError('Credenciais inválidas', API_ERROR_CODES.UNAUTHORIZED, 401);
    }

    if (user.account.status === 'inactive') {
      throw new ApiBusinessError('Conta desativada', API_ERROR_CODES.NOT_ALLOWED, 403);
    }

    return user;
  }

  async changePassword(userId: string, newPassword: string) {
    const passwordHash = await argon2.hash(newPassword);

    const user = await prisma.accountUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiBusinessError('Usuário não encontrado', API_ERROR_CODES.NOT_FOUND, 404);
    }

    return await prisma.accountUser.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordResetRequired: false,
      },
    });
  }

  async getProfile(userId: string) {
    return await prisma.accountUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        account: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });
  }

  async updateProfile(userId: string, data: { name?: string, email?: string, password?: string }) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.password) {
      updateData.passwordHash = await argon2.hash(data.password);
    }

    return await prisma.accountUser.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
  }
}
