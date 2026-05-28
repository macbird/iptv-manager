import { api } from '../../../shared/api/api.client';
import type { LoginInput, RegisterInput } from '@iptv-manager/shared';

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  changePassword: async (newPassword: string) => {
    const response = await api.post('/auth/change-password', { newPassword });
    return response.data;
  },
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateProfile: async (data: { name?: string, email?: string, password?: string }) => {
    const response = await api.patch('/auth/me', data);
    return response.data;
  },
};
