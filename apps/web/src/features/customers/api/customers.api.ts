import { api } from '../../../shared/api/api.client';
import { toListQueryParams } from '../../../shared/api/list-params';
import type { PaginatedListParams } from '../../../shared/hooks/usePaginatedList';
import type { CustomerInput, CustomerListItem, PaginatedResponse } from '@client-manager/shared';

export const customersApi = {
  list: async (params: PaginatedListParams): Promise<PaginatedResponse<CustomerListItem>> => {
    const response = await api.get('/customers', { params: toListQueryParams(params) });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/customers/${id}`);
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
  deactivate: async (id: string) => {
    const response = await api.patch(`/customers/${id}/deactivate`);
    return response.data;
  },
  activate: async (id: string) => {
    const response = await api.patch(`/customers/${id}/activate`);
    return response.data;
  },
};
