import { api } from '../../../shared/api/api.client';
import type { AuditLogListItem, PaginatedResponse } from '@client-manager/shared';
import type { PaginatedListParams } from '../../../shared/api/list-params';
import { toListQueryParams } from '../../../shared/api/list-params';

export const logsApi = {
  list: async (params: PaginatedListParams): Promise<PaginatedResponse<AuditLogListItem>> => {
    const { data } = await api.get('/logs', { params: toListQueryParams(params) });
    return data;
  },
};
