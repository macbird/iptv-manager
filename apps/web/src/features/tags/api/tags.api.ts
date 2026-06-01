import { api } from '../../../shared/api/api.client';
import type { TagInput } from '@client-manager/shared';

export interface TagDto {
  id: string;
  name: string;
  color?: string | null;
}

export const tagsApi = {
  list: async (params: { page: number; pageSize: number; filter: string; scope?: 'customer' | 'server' }) => {
    const response = await api.get('/tags', { params });
    return response.data as { data: TagDto[]; total: number };
  },

  getAll: async (scope?: 'customer' | 'server') => {
    const response = await api.get('/tags', {
      params: { page: 1, pageSize: 1000, filter: '', scope },
    });
    return (response.data as { data: TagDto[] }).data;
  },

  search: async (query: string) => {
    const response = await api.get('/tags/search', { params: { q: query } });
    return response.data as TagDto[];
  },

  findOrCreate: async (name: string) => {
    const response = await api.post('/tags/find-or-create', { name });
    return response.data as TagDto;
  },

  create: async (data: TagInput) => {
    const response = await api.post('/tags', data);
    return response.data as TagDto;
  },

  update: async (id: string, data: TagInput) => {
    const response = await api.put(`/tags/${id}`, data);
    return response.data as TagDto;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/tags/${id}`);
    return response.data;
  },
};
