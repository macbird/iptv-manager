import { api } from '../../../shared/api/api.client';
import { toListQueryParams } from '../../../shared/api/list-params';
import type { PaginatedListParams } from '../../../shared/hooks/usePaginatedList';
import type { PlatformPlanInput, PlatformPlanListItem, PaginatedResponse } from '@client-manager/shared';

export const platformPlansApi = {
  list: async (
    params: PaginatedListParams & { selectableOnly?: boolean },
  ): Promise<PaginatedResponse<PlatformPlanListItem>> => {
    const response = await api.get('/admin/platform-plans', {
      params: toListQueryParams(params),
    });
    return response.data;
  },
  getById: async (id: string): Promise<PlatformPlanListItem> => {
    const response = await api.get(`/admin/platform-plans/${id}`);
    return response.data;
  },
  create: async (data: PlatformPlanInput) => {
    const response = await api.post('/admin/platform-plans', data);
    return response.data;
  },
  update: async (id: string, data: PlatformPlanInput) => {
    const response = await api.patch(`/admin/platform-plans/${id}`, data);
    return response.data;
  },
  remove: async (id: string) => {
    const response = await api.delete(`/admin/platform-plans/${id}`);
    return response.data;
  },
};
