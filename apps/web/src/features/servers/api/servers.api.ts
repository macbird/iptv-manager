import { api } from '../../../shared/api/api.client';
import { toListQueryParams } from '../../../shared/api/list-params';
import type { PaginatedListParams } from '../../../shared/hooks/usePaginatedList';
import type { ServerFormPayload } from '../pages/ServerForm';

export const serversApi = {
  list: async (params: PaginatedListParams) => {
    const response = await api.get('/servers', { params: toListQueryParams(params) });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/servers/${id}`);
    return response.data;
  },
  create: async (data: ServerFormPayload) => {
    const response = await api.post('/servers', data);
    return response.data;
  },
  update: async (id: string, data: ServerFormPayload) => {
    const response = await api.put(`/servers/${id}`, data);
    return response.data;
  },
  deactivate: async (id: string) => {
    const response = await api.patch(`/servers/${id}/deactivate`);
    return response.data;
  },
  activate: async (id: string) => {
    const response = await api.patch(`/servers/${id}/activate`);
    return response.data;
  },
};
