import { api } from '../../../shared/api/api.client';
import type { PlanInput } from '@client-manager/shared';

export const plansApi = {
  list: async (params: { page: number, pageSize: number, filter: string }) => {
    const response = await api.get('/plans', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/plans/${id}`);
    return response.data;
  },
  create: async (data: PlanInput) => {
    const response = await api.post('/plans', data);
    return response.data;
  },
  update: async (id: string, data: PlanInput) => {
    const response = await api.put(`/plans/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/plans/${id}`);
    return response.data;
  },
};
