import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantBillingApi } from '../../billing/api/billing.api';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import { WhatsAppProviderFields } from '../components/PaymentProviderFields';
import {
  PaymentCredentialsSection,
  buildCredentialFormState,
  type PaymentCredentialFormState,
} from '../components/PaymentCredentialsSection';
import { selectedProviderToPayload } from '../components/PaymentRoutingSection';
import {
  APP_NAME,
  getApiErrorMessage,
  type EnabledPaymentProviderValue,
  type WhatsAppConnectionStatusValue,
  type TenantChargeMessagesSettingsDto,
  type BillingAutomationSettingsDto,
  DEFAULT_OVERDUE_REMINDERS_SETTINGS,
} from '@client-manager/shared';
import {
  DEFAULT_CHARGE_MESSAGE_DELAY_MS,
  DEFAULT_CHARGE_MESSAGE_TEMPLATES,
  DEFAULT_ONE_OFF_CHARGE_MESSAGE_TEMPLATES,
  buildDefaultOverdueChargeMessages,
  extractOverdueReminderDays,
} from '@client-manager/shared';
import { showToast } from '../../../shared/utils/toast';
import { WebhookLogsSection } from '../components/WebhookLogsSection';
import { ChargeMessageTemplatesSection } from '../components/ChargeMessageTemplatesSection';
import { OverdueChargeMessageTemplatesSection } from '../components/OverdueChargeMessageTemplatesSection';
import { BillingAutomationSection } from '../components/BillingAutomationSection';
import { SettingsTabs, useChargeSettingsSubTab, useSettingsTab } from '../components/SettingsTabs';

const SETTINGS_TABS = [
  { id: 'geral', label: 'Geral' },
  { id: 'pagamentos', label: 'Pagamentos' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'cobranca', label: 'Cobrança' },
  { id: 'automacao', label: 'Automação' },
] as const;

const CHARGE_SETTINGS_SUB_TABS = [
  { id: 'inicial', label: 'Cobrança inicial (D-N)', shortLabel: 'Inicial · D-N' },
  { id: 'pos-vencimento', label: 'Pós-vencimento (D+N)', shortLabel: 'Pós-venc. · D+N' },
] as const;

const DEFAULT_CHARGE_MESSAGES: TenantChargeMessagesSettingsDto = {
  subscription: {
    templates: [...DEFAULT_CHARGE_MESSAGE_TEMPLATES],
    delayMs: DEFAULT_CHARGE_MESSAGE_DELAY_MS,
  },
  oneOff: {
    templates: [...DEFAULT_ONE_OFF_CHARGE_MESSAGE_TEMPLATES],
    delayMs: DEFAULT_CHARGE_MESSAGE_DELAY_MS,
  },
  overdue: buildDefaultOverdueChargeMessages(),
};

const DEFAULT_AUTOMATION: BillingAutomationSettingsDto = {
  active: true,
  daysBeforeDue: 3,
  sendWhatsapp: true,
  sendPaymentCharge: true,
  automationRunHour: 9,
  automationRunMinute: 0,
  autoCloseSubscriptionInvoices: false,
  closeSubscriptionInvoiceAfterDays: 30,
  overdueReminders: { ...DEFAULT_OVERDUE_REMINDERS_SETTINGS },
};

function formatBrl(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export const TenantSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { activeTab, setActiveTab } = useSettingsTab('geral');
  const { activeSubTab: chargeSubTab, setActiveSubTab: setChargeSubTab } =
    useChargeSettingsSubTab('inicial');
  const { data, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: tenantBillingApi.getSettings,
  });

  const [credentials, setCredentials] = React.useState<PaymentCredentialFormState[]>([]);
  const paymentProvider: EnabledPaymentProviderValue = 'mercadopago';
  const [whatsappProvider, setWhatsappProvider] = React.useState('evolution');
  const [whatsappInstanceUrl, setWhatsappInstanceUrl] = React.useState('');
  const [whatsappApiKey, setWhatsappApiKey] = React.useState('');
  const [chargeMessages, setChargeMessages] =
    React.useState<TenantChargeMessagesSettingsDto>(DEFAULT_CHARGE_MESSAGES);
  const [billingAutomation, setBillingAutomation] =
    React.useState<BillingAutomationSettingsDto>(DEFAULT_AUTOMATION);

  React.useEffect(() => {
    if (!data) return;
    setCredentials(buildCredentialFormState(data.paymentCredentials));
    setWhatsappProvider(data.whatsapp.provider);
    setWhatsappInstanceUrl(data.whatsapp.instanceUrl ?? '');
    if (data.chargeMessages) {
      setChargeMessages(data.chargeMessages);
    }
    if (data.billingAutomation) {
      const daysFromWindows = data.chargeMessages?.overdue?.windows?.length
        ? extractOverdueReminderDays(data.chargeMessages.overdue)
        : data.billingAutomation.overdueReminders.daysAfterDue;

      setBillingAutomation({
        ...data.billingAutomation,
        overdueReminders: {
          ...data.billingAutomation.overdueReminders,
          daysAfterDue: daysFromWindows,
        },
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await tenantBillingApi.updatePaymentCredentials({
        credentials: credentials.map((item) => ({
          provider: item.provider,
          active: item.provider === paymentProvider,
          ...(item.apiKey ? { apiKey: item.apiKey } : {}),
          ...(item.webhookToken ? { webhookToken: item.webhookToken } : {}),
        })),
      });

      await tenantBillingApi.updatePaymentRouting(selectedProviderToPayload(paymentProvider));

      await tenantBillingApi.updateSettings({
        whatsappProvider,
        ...(whatsappProvider === 'meta'
          ? {
              whatsappInstanceUrl,
              whatsappApiKey: whatsappApiKey || undefined,
            }
          : {}),
      });

      await tenantBillingApi.updateChargeMessages(chargeMessages);

      const overdueDays = extractOverdueReminderDays(chargeMessages.overdue);
      await tenantBillingApi.updateBillingAutomation({
        ...billingAutomation,
        overdueReminders: {
          ...billingAutomation.overdueReminders,
          daysAfterDue:
            overdueDays.length > 0
              ? overdueDays
              : billingAutomation.overdueReminders.daysAfterDue,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
      queryClient.invalidateQueries({ queryKey: ['billing-automation-last-run'] });
      queryClient.invalidateQueries({ queryKey: ['billing-automation-preview'] });
      setWhatsappApiKey('');
      showToast.success('Configurações salvas');
    },
    onError: (error: unknown) => {
      showToast.error(getApiErrorMessage(error, 'Erro ao salvar configurações'));
    },
  });

  if (isLoading) {
    return (
      <div className="relative h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const sub = data?.subscription;

  return (
    <PageLayout
      title="Configurações"
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <SettingsTabs tabs={[...SETTINGS_TABS]} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'geral' ? (
          <section className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-5">
            <h2 className="text-base font-semibold text-slate-900">Minha assinatura ({APP_NAME})</h2>
            <p className="mt-1 text-sm text-slate-600">
              Valor definido pela plataforma — não editável aqui.
            </p>
            {sub ? (
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-slate-500">Plano</dt>
                  <dd className="font-medium text-slate-900">{sub.planName}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Valor mensal</dt>
                  <dd className="font-medium text-slate-900">{formatBrl(sub.priceCents)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Vencimento</dt>
                  <dd className="font-medium text-slate-900">Dia {sub.dueDay}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Status</dt>
                  <dd className="font-medium text-slate-900">{sub.status}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-amber-700">Nenhuma assinatura SaaS vinculada.</p>
            )}
          </section>
        ) : null}

        {activeTab === 'pagamentos' ? (
          <>
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Meios de pagamento (PIX)</h2>
              <div className="mt-4">
                <PaymentCredentialsSection
                  credentials={credentials}
                  onChange={setCredentials}
                  mercadoPagoWebhookUrl={data?.mercadoPagoWebhookUrl}
                  mercadoPagoWebhookRequiresToken={data?.mercadoPagoWebhookRequiresToken}
                  legacyProviderWarning={data?.legacyProviderWarning}
                />
              </div>
            </section>
            <WebhookLogsSection />
          </>
        ) : null}

        {activeTab === 'whatsapp' ? (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">WhatsApp</h2>
            <div className="mt-4">
              <WhatsAppProviderFields
                whatsappProvider={whatsappProvider}
                whatsappInstanceUrl={whatsappInstanceUrl}
                whatsappApiKey={whatsappApiKey}
                onProviderChange={setWhatsappProvider}
                onInstanceUrlChange={setWhatsappInstanceUrl}
                onApiKeyChange={setWhatsappApiKey}
                apiKeyConfigured={data?.whatsapp.apiKeyConfigured}
                metaConnection={
                  data?.whatsapp
                    ? {
                        provider: data.whatsapp.provider,
                        connectionStatus:
                          data.whatsapp.connectionStatus as WhatsAppConnectionStatusValue,
                        wabaId: data.whatsapp.wabaId,
                        phoneNumberId: data.whatsapp.phoneNumberId,
                        displayPhoneNumber: data.whatsapp.displayPhoneNumber,
                        tokenConfigured: data.whatsapp.apiKeyConfigured,
                        tokenExpiresAt: data.whatsapp.tokenExpiresAt,
                        instanceUrl: data.whatsapp.instanceUrl,
                      }
                    : null
                }
                evolutionConnection={
                  data?.whatsapp?.provider === 'evolution'
                    ? {
                        provider: 'evolution',
                        connectionStatus:
                          data.whatsapp.connectionStatus as WhatsAppConnectionStatusValue,
                        instanceName: data.accountSlug,
                        displayPhoneNumber: data.whatsapp.displayPhoneNumber,
                        instanceConfigured: data.whatsapp.apiKeyConfigured,
                      }
                    : null
                }
              />
            </div>
          </section>
        ) : null}

        {activeTab === 'cobranca' ? (
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 pt-4">
              <h2 className="text-base font-semibold text-slate-900">Mensagens de cobrança</h2>
              <p className="mt-1 text-sm text-slate-600">
                Templates WhatsApp por tipo de automação — cobrança antes do vencimento (D-N) ou
                lembretes após vencer (D+N).
              </p>
              <div className="mt-4">
                <SettingsTabs
                  tabs={[...CHARGE_SETTINGS_SUB_TABS]}
                  activeTab={chargeSubTab}
                  onChange={setChargeSubTab}
                  variant="segmented"
                />
              </div>
            </div>

            <div className="p-5">
              {chargeSubTab === 'inicial' ? (
                <div className="space-y-8">
                  <ChargeMessageTemplatesSection
                    title="Mensagens — assinatura"
                    value={chargeMessages.subscription}
                    onChange={(subscription) =>
                      setChargeMessages({ ...chargeMessages, subscription })
                    }
                  />
                  <div className="border-t border-slate-200 pt-8">
                    <ChargeMessageTemplatesSection
                      title="Mensagens — avulsa (padrão)"
                      value={chargeMessages.oneOff}
                      onChange={(oneOff) => setChargeMessages({ ...chargeMessages, oneOff })}
                    />
                  </div>
                </div>
              ) : null}

              {chargeSubTab === 'pos-vencimento' ? (
                <OverdueChargeMessageTemplatesSection
                  value={chargeMessages.overdue}
                  onChange={(overdue) => {
                    setChargeMessages({ ...chargeMessages, overdue });
                    setBillingAutomation((current) => ({
                      ...current,
                      overdueReminders: {
                        ...current.overdueReminders,
                        daysAfterDue: extractOverdueReminderDays(overdue),
                      },
                    }));
                  }}
                  delayMs={chargeMessages.subscription.delayMs}
                />
              ) : null}
            </div>
          </section>
        ) : null}

        {activeTab === 'automacao' ? (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <BillingAutomationSection value={billingAutomation} onChange={setBillingAutomation} />
          </section>
        ) : null}
      </div>
    </PageLayout>
  );
};
