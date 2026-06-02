import { api } from '../../../shared/api/api.client';
import type { ActivationListItem, PaginatedResponse, UpdateActivationStatusInput } from '@client-manager/shared';
import type { PaginatedListParams } from '../../../shared/api/list-params';
import { toListQueryParams } from '../../../shared/api/list-params';

export const activationsApi = {
  list: async (
    params: PaginatedListParams & { status?: string },
  ): Promise<PaginatedResponse<ActivationListItem>> => {
    const { data } = await api.get('/activations', { params: toListQueryParams(params) });
    return data;
  },

  pendingCount: async (): Promise<number> => {
    const { data } = await api.get('/activations/pending-count');
    return data.count as number;
  },

  complete: async (id: string, notes?: string) => {
    const { data } = await api.post(`/activations/${id}/complete`, { notes });
    return data;
  },

  updateStatus: async (id: string, payload: UpdateActivationStatusInput) => {
    const { data } = await api.patch(`/activations/${id}/status`, payload);
    return data;
  },
};
