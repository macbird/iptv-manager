import { api } from '../../../shared/api/api.client';

export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalPlans: number;
  totalServers: number;
  totalConnections: number;
  expiringSoon: number;
  expired: number;
  estimatedMrr: number;
}

export interface UpcomingExpiration {
  id: string;
  name: string;
  expiresAt: string;
  status: string;
  plan: { name: string } | null;
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getUpcomingExpirations: async (limit = 5): Promise<UpcomingExpiration[]> => {
    const response = await api.get('/dashboard/expirations', { params: { limit } });
    return response.data;
  },
};
