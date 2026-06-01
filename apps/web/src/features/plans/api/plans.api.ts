import { api } from '../../../shared/api/api.client';
import { toListQueryParams } from '../../../shared/api/list-params';
import type { PaginatedListParams } from '../../../shared/hooks/usePaginatedList';
import type { PlanInput } from '@client-manager/shared';

export const plansApi = {
  list: async (params: PaginatedListParams) => {
    const response = await api.get('/plans', { params: toListQueryParams(params) });
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
