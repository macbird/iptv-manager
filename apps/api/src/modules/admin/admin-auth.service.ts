import { prisma } from '../../core/database';
import argon2 from 'argon2';
import { API_ERROR_CODES, ApiBusinessError } from '@client-manager/shared';

export class AdminAuthService {
  async login(email: string, password: string) {
    const admin = await prisma.platformAdmin.findUnique({ where: { email } });
    if (!admin) {
      throw new ApiBusinessError('Credenciais inválidas', API_ERROR_CODES.UNAUTHORIZED, 401);
    }

    if (!(await argon2.verify(admin.password, password))) {
      throw new ApiBusinessError('Credenciais inválidas', API_ERROR_CODES.UNAUTHORIZED, 401);
    }
    return admin;
  }

  async getProfile(id: string) {
    return await prisma.platformAdmin.findUnique({
      where: { id },
      select: { id: true, email: true }
    });
  }

  async updateProfile(id: string, data: { email?: string, password?: string }) {
    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.password) {
      updateData.password = await argon2.hash(data.password);
    }

    return await prisma.platformAdmin.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true }
    });
  }
}
