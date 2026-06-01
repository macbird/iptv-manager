import { api } from '../../../shared/api/api.client';
import type { MonthlyBillingPoint } from '../../../shared/ui/billing/BillingMonthlyBars';
import type { RecentPaymentItem } from '../../../shared/ui/billing/RecentPaymentsList';

export interface BillingSnapshot {
  openInvoices: number;
  overdueInvoices: number;
  paidInCurrentCycle: number;
  openAmountCents: number;
  receivedCurrentMonthCents: number;
  issuedCurrentMonthCents: number;
  collectionRate: number;
}

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
  billing: BillingSnapshot;
  monthlyBilling: MonthlyBillingPoint[];
  recentPayments: RecentPaymentItem[];
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
