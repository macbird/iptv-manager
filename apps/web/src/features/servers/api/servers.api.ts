import { api } from '../../../shared/api/api.client';
import type { ServerInput } from '@client-manager/shared';

export const serversApi = {
  list: async (params: { page: number, pageSize: number, filter: string }) => {
    const response = await api.get('/servers', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/servers/${id}`);
    return response.data;
  },
  create: async (data: ServerInput) => {
    const response = await api.post('/servers', data);
    return response.data;
  },
  update: async (id: string, data: ServerInput) => {
    const response = await api.put(`/servers/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/servers/${id}`);
    return response.data;
  },
};
