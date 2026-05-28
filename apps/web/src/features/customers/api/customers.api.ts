import { api } from '../../../shared/api/api.client';
import type { CustomerInput } from '@iptv-manager/shared';

export const customersApi = {
  list: async () => {
    const response = await api.get('/customers');
    return response.data;
  },
  create: async (data: CustomerInput) => {
    const response = await api.post('/customers', data);
    return response.data;
  },
  update: async (id: string, data: CustomerInput) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },
};
