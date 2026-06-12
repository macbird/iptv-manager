import { api } from '../../../shared/api/api.client';
import { toListQueryParams } from '../../../shared/api/list-params';
import type { PaginatedListParams } from '../../../shared/hooks/usePaginatedList';
import type {
  CreateManualInvoiceInput,
  InvoiceDetailDto,
  InvoiceListItem,
  MetaEmbeddedSignupConfigDto,
  MetaEmbeddedSignupInput,
  PaginatedResponse,
  PaymentDetailDto,
  PaymentListItem,
  PaymentWebhookLogDto,
  PlatformSettingsDto,
  RegisterPaymentInput,
  TenantSettingsDto,
  WhatsAppEvolutionConnectionDto,
  WhatsAppMetaConnectionDto,
  ChargeMessageSettingsDto,
  TenantChargeMessagesSettingsDto,
  BillingAutomationLastRunDto,
  BillingAutomationPreviewDto,
  BillingAutomationSettingsDto,
  EvolutionConnectInput,
  EvolutionConnectResponseDto,
  EvolutionTestMessageInput,
  EvolutionTestMessageResponseDto,
} from '@client-manager/shared';

export const platformBillingApi = {
  getSettings: async (): Promise<PlatformSettingsDto> => {
    const { data } = await api.get('/admin/platform-settings');
    return data;
  },
  updateSettings: async (payload: Record<string, unknown>): Promise<PlatformSettingsDto> => {
    const { data } = await api.patch('/admin/platform-settings', payload);
    return data;
  },
  listInvoices: async (
    params: PaginatedListParams,
  ): Promise<PaginatedResponse<InvoiceListItem>> => {
    const { data } = await api.get('/admin/invoices', { params: toListQueryParams(params) });
    return data;
  },
  listPayments: async (params: PaginatedListParams): Promise<PaginatedResponse<PaymentListItem>> => {
    const { data } = await api.get('/admin/payments', { params: toListQueryParams(params) });
    return data;
  },
  getInvoice: async (id: string): Promise<InvoiceDetailDto> => {
    const { data } = await api.get(`/admin/invoices/${id}`);
    return data;
  },
  cancelInvoice: async (id: string, reason?: string): Promise<InvoiceDetailDto> => {
    const { data } = await api.post(`/admin/invoices/${id}/cancel`, { reason });
    return data;
  },
  recreateInvoice: async (
    id: string,
    payload: { amountCents: number; dueDate: string },
  ): Promise<InvoiceDetailDto> => {
    const { data } = await api.post(`/admin/invoices/${id}/recreate`, payload);
    return data;
  },
  getPayment: async (id: string): Promise<PaymentDetailDto> => {
    const { data } = await api.get(`/admin/payments/${id}`);
    return data;
  },
  generatePix: async (invoiceId: string) => {
    const { data } = await api.post(`/admin/invoices/${invoiceId}/generate-pix`);
    return data;
  },
  sendCharge: async (invoiceId: string) => {
    const { data } = await api.post(`/admin/invoices/${invoiceId}/send-charge`);
    return data;
  },
  markPaid: async (invoiceId: string) => {
    const { data } = await api.post(`/admin/invoices/${invoiceId}/mark-paid`);
    return data;
  },
};

export const tenantBillingApi = {
  getSettings: async (): Promise<TenantSettingsDto & { subscription: unknown }> => {
    const { data } = await api.get('/settings');
    return data;
  },
  getWebhookLogs: async (): Promise<PaymentWebhookLogDto[]> => {
    const { data } = await api.get('/settings/webhook-logs');
    return data;
  },
  updateSettings: async (payload: Record<string, unknown>) => {
    const { data } = await api.patch('/settings', payload);
    return data;
  },
  getMetaWhatsappConfig: async (): Promise<MetaEmbeddedSignupConfigDto> => {
    const { data } = await api.get('/settings/whatsapp/meta/config');
    return data;
  },
  getMetaWhatsappConnection: async (): Promise<WhatsAppMetaConnectionDto> => {
    const { data } = await api.get('/settings/whatsapp/meta/connection');
    return data;
  },
  connectMetaWhatsapp: async (
    payload: MetaEmbeddedSignupInput,
  ): Promise<WhatsAppMetaConnectionDto> => {
    const { data } = await api.post('/settings/whatsapp/meta/connect', payload);
    return data;
  },
  disconnectMetaWhatsapp: async (): Promise<WhatsAppMetaConnectionDto> => {
    const { data } = await api.post('/settings/whatsapp/meta/disconnect');
    return data;
  },
  getEvolutionWhatsappConnection: async (): Promise<WhatsAppEvolutionConnectionDto> => {
    const { data } = await api.get('/settings/whatsapp/evolution/connection');
    return data;
  },
  connectEvolutionWhatsapp: async (
    payload?: EvolutionConnectInput,
  ): Promise<EvolutionConnectResponseDto> => {
    const { data } = await api.post('/settings/whatsapp/evolution/connect', payload ?? {});
    return data;
  },
  disconnectEvolutionWhatsapp: async (): Promise<WhatsAppEvolutionConnectionDto> => {
    const { data } = await api.post('/settings/whatsapp/evolution/disconnect');
    return data;
  },
  sendEvolutionTestMessage: async (
    payload?: EvolutionTestMessageInput,
  ): Promise<EvolutionTestMessageResponseDto> => {
    const { data } = await api.post('/settings/whatsapp/evolution/test-message', payload ?? {});
    return data;
  },
  getChargeMessages: async (): Promise<TenantChargeMessagesSettingsDto> => {
    const { data } = await api.get('/settings/charge-messages');
    return data;
  },
  updateChargeMessages: async (
    payload: TenantChargeMessagesSettingsDto,
  ): Promise<TenantChargeMessagesSettingsDto> => {
    const { data } = await api.patch('/settings/charge-messages', payload);
    return data;
  },
  getBillingAutomation: async (): Promise<BillingAutomationSettingsDto> => {
    const { data } = await api.get('/settings/billing-automation');
    return data;
  },
  updateBillingAutomation: async (
    payload: BillingAutomationSettingsDto,
  ): Promise<BillingAutomationSettingsDto> => {
    const { data } = await api.patch('/settings/billing-automation', payload);
    return data;
  },
  getBillingAutomationLastRun: async (): Promise<BillingAutomationLastRunDto> => {
    const { data } = await api.get('/settings/billing-automation/last-run');
    return data;
  },
  getBillingAutomationPreview: async (params?: {
    scenario?: 'current' | 'next_scheduled_run';
  }): Promise<BillingAutomationPreviewDto> => {
    const { data } = await api.get('/settings/billing-automation/preview', { params });
    return data;
  },
  updateInvoiceChargeMessages: async (
    invoiceId: string,
    payload: ChargeMessageSettingsDto,
  ): Promise<InvoiceDetailDto> => {
    const { data } = await api.patch(`/invoices/${invoiceId}/charge-messages`, payload);
    return data;
  },
  updatePaymentCredentials: async (payload: {
    credentials: Array<{
      provider: string;
      active?: boolean;
      apiKey?: string;
      webhookToken?: string;
    }>;
  }) => {
    const { data } = await api.put('/settings/payment-credentials', payload);
    return data;
  },
  updatePaymentRouting: async (payload: {
    rules: Array<{ minAmountCents: number; provider: string; active?: boolean }>;
  }) => {
    const { data } = await api.put('/settings/payment-routing', payload);
    return data;
  },
  previewPaymentRouting: async (amountCents: number) => {
    const { data } = await api.get('/settings/payment-routing/preview', {
      params: { amountCents },
    });
    return data;
  },
  listInvoices: async (
    params: PaginatedListParams,
  ): Promise<PaginatedResponse<InvoiceListItem>> => {
    const { data } = await api.get('/invoices', { params: toListQueryParams(params) });
    return data;
  },
  listPayments: async (params: PaginatedListParams): Promise<PaginatedResponse<PaymentListItem>> => {
    const { data } = await api.get('/payments', { params: toListQueryParams(params) });
    return data;
  },
  getInvoice: async (id: string): Promise<InvoiceDetailDto> => {
    const { data } = await api.get(`/invoices/${id}`);
    return data;
  },
  cancelInvoice: async (id: string, reason?: string): Promise<InvoiceDetailDto> => {
    const { data } = await api.post(`/invoices/${id}/cancel`, { reason });
    return data;
  },
  recreateInvoice: async (
    id: string,
    payload: { amountCents: number; dueDate: string },
  ): Promise<InvoiceDetailDto> => {
    const { data } = await api.post(`/invoices/${id}/recreate`, payload);
    return data;
  },
  getPayment: async (id: string): Promise<PaymentDetailDto> => {
    const { data } = await api.get(`/payments/${id}`);
    return data;
  },
  generatePix: async (invoiceId: string) => {
    const { data } = await api.post(`/invoices/${invoiceId}/generate-pix`);
    return data;
  },
  sendCharge: async (invoiceId: string) => {
    const { data } = await api.post(`/invoices/${invoiceId}/send-charge`);
    return data;
  },
  markPaid: async (invoiceId: string, payload?: RegisterPaymentInput) => {
    const { data } = await api.post(`/invoices/${invoiceId}/mark-paid`, payload ?? {});
    return data;
  },
  createInvoice: async (payload: CreateManualInvoiceInput): Promise<InvoiceDetailDto> => {
    const { data } = await api.post('/invoices', payload);
    return data;
  },
  registerPayment: async (invoiceId: string, payload: RegisterPaymentInput) => {
    const { data } = await api.post(`/invoices/${invoiceId}/register-payment`, payload);
    return data;
  },
};
