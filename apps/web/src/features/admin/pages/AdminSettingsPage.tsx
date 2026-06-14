import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { platformBillingApi } from '../../billing/api/billing.api';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { primaryButtonClass } from '../../../shared/ui/buttons/button-styles';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import {
  PaymentProviderFields,
  WhatsAppProviderFields,
} from '../../settings/components/PaymentProviderFields';
import { ChargeMessageTemplatesSection } from '../../settings/components/ChargeMessageTemplatesSection';
import { SettingsTabs, useSettingsTab } from '../../settings/components/SettingsTabs';
import { AdminPlatformAutomationSection } from '../components/AdminPlatformAutomationSection';
import {
  APP_NAME,
  DEFAULT_CHARGE_MESSAGE_DELAY_MS,
  DEFAULT_PLATFORM_SAAS_CHARGE_MESSAGE_TEMPLATES,
  getApiErrorMessage,
  type ChargeMessageSettingsDto,
  type PlatformBillingAutomationSettingsDto,
  type WhatsAppConnectionStatusValue,
} from '@client-manager/shared';
import { showToast } from '../../../shared/utils/toast';

const ADMIN_SETTINGS_TABS = [
  { id: 'geral', label: 'Geral' },
  { id: 'pagamentos', label: 'Pagamentos' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'cobranca', label: 'Cobrança' },
  { id: 'automacao', label: 'Automação' },
] as const;

const DEFAULT_CHARGE_MESSAGES: ChargeMessageSettingsDto = {
  templates: [...DEFAULT_PLATFORM_SAAS_CHARGE_MESSAGE_TEMPLATES],
  delayMs: DEFAULT_CHARGE_MESSAGE_DELAY_MS,
};

export const AdminSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { activeTab, setActiveTab } = useSettingsTab('geral');
  const { data, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: platformBillingApi.getSettings,
  });

  const [planName, setPlanName] = React.useState('');
  const [priceCents, setPriceCents] = React.useState('');
  const [paymentApiKey, setPaymentApiKey] = React.useState('');
  const [paymentWebhookToken, setPaymentWebhookToken] = React.useState('');
  const [overdueDays, setOverdueDays] = React.useState('7');
  const [whatsappProvider, setWhatsappProvider] = React.useState('evolution');
  const [whatsappInstanceUrl, setWhatsappInstanceUrl] = React.useState('');
  const [whatsappApiKey, setWhatsappApiKey] = React.useState('');
  const [chargeMessages, setChargeMessages] =
    React.useState<ChargeMessageSettingsDto>(DEFAULT_CHARGE_MESSAGES);
  const [billingAutomation, setBillingAutomation] =
    React.useState<PlatformBillingAutomationSettingsDto | null>(null);

  React.useEffect(() => {
    if (!data) return;
    setPlanName(data.defaultPlan.name);
    setPriceCents(String(data.defaultPlan.priceCents / 100));
    setPaymentWebhookToken('');
    setPaymentApiKey('');
    setOverdueDays(String(data.payment.overdueDays));
    setWhatsappProvider(data.whatsapp.provider);
    setWhatsappInstanceUrl(data.whatsapp.instanceUrl ?? '');
    setChargeMessages(data.chargeMessages ?? DEFAULT_CHARGE_MESSAGES);
    setBillingAutomation(data.billingAutomation);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (activeTab === 'geral') {
        await platformBillingApi.updateSettings({
          planName,
          priceCents: Math.round(parseFloat(priceCents.replace(',', '.')) * 100),
          overdueDays: parseInt(overdueDays, 10),
        });
        return;
      }
      if (activeTab === 'pagamentos') {
        await platformBillingApi.updateSettings({
          paymentProvider: 'mercadopago',
          paymentApiKey: paymentApiKey || undefined,
          paymentWebhookToken: paymentWebhookToken || undefined,
        });
        return;
      }
      if (activeTab === 'whatsapp') {
        await platformBillingApi.updateSettings({
          whatsappProvider,
          ...(whatsappProvider === 'meta'
            ? {
                whatsappInstanceUrl,
                whatsappApiKey: whatsappApiKey || undefined,
              }
            : {}),
        });
        return;
      }
      if (activeTab === 'cobranca') {
        await platformBillingApi.updateChargeMessages(chargeMessages);
        return;
      }
      if (activeTab === 'automacao' && billingAutomation) {
        await platformBillingApi.updateAutomation(billingAutomation);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      setPaymentApiKey('');
      setPaymentWebhookToken('');
      setWhatsappApiKey('');
      showToast.success('Configurações salvas');
    },
    onError: (error) =>
      showToast.error(getApiErrorMessage(error, 'Erro ao salvar configurações')),
  });

  if (isLoading || !billingAutomation) {
    return (
      <div className="relative h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const paymentHealthy = data?.payment.apiKeyConfigured;

  return (
    <PageLayout
      title="Configurações"
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className={primaryButtonClass}
          >
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <SettingsTabs
          tabs={[...ADMIN_SETTINGS_TABS]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'geral' ? (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Plano padrão</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Valor usado quando nenhum plano específico é selecionado na conta.
                </p>
              </div>
              <Link
                to="/admin/plans"
                className="text-sm font-medium text-form-primary hover:text-form-primary-hover"
              >
                Gerenciar planos
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nome do plano</label>
                <input
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 p-2 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Valor mensal (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceCents}
                  onChange={(e) => setPriceCents(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 p-2 shadow-sm"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">
                Dias após vencimento para suspender conta
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={overdueDays}
                onChange={(e) => setOverdueDays(e.target.value)}
                className="mt-1 block w-24 rounded-md border border-slate-300 p-2 shadow-sm"
              />
            </div>
          </section>
        ) : null}

        {activeTab === 'pagamentos' ? (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">PIX da plataforma</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  paymentHealthy ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {paymentHealthy ? 'Token salvo' : 'Sem token'}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Credenciais Mercado Pago para receber pagamentos das revendas.
            </p>
            {data?.payment.apiKeyConfigured ? (
              <p className="mt-2 text-xs text-slate-500">
                Se você não configurou manualmente, pode ser dado de desenvolvimento do{' '}
                <code className="text-[11px]">seed:billing</code> — substitua pelo token real do
                Mercado Pago.
              </p>
            ) : null}
            <div className="mt-4">
              <PaymentProviderFields
                paymentApiKey={paymentApiKey}
                paymentWebhookToken={paymentWebhookToken}
                onPaymentApiKeyChange={setPaymentApiKey}
                onPaymentWebhookTokenChange={setPaymentWebhookToken}
                apiKeyConfigured={data?.payment.apiKeyConfigured}
                webhookConfigured={data?.payment.webhookTokenConfigured}
              />
            </div>
          </section>
        ) : null}

        {activeTab === 'whatsapp' ? (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">WhatsApp da plataforma</h2>
            <p className="mt-1 text-sm text-slate-500">
              Opcional — cobrança e avisos para revendas ({APP_NAME}).
            </p>
            <div className="mt-4">
              <WhatsAppProviderFields
                scope="platform"
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
                        instanceName: 'platform',
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
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Mensagens para revendas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Templates WhatsApp enviados à revenda na cobrança da fatura.
            </p>
            <div className="mt-4">
              <ChargeMessageTemplatesSection
                value={chargeMessages}
                onChange={setChargeMessages}
              />
            </div>
          </section>
        ) : null}

        {activeTab === 'automacao' ? (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <AdminPlatformAutomationSection
              value={billingAutomation}
              onChange={setBillingAutomation}
            />
          </section>
        ) : null}
      </div>
    </PageLayout>
  );
};
