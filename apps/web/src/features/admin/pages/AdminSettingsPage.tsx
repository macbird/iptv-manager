import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { platformBillingApi } from '../../billing/api/billing.api';
import { PageLayout } from '../../../shared/ui/layout/PageLayout';
import { LoadingSpinner } from '../../../shared/ui/layout/LoadingSpinner';
import {
  PaymentProviderFields,
  WhatsAppProviderFields,
} from '../../settings/components/PaymentProviderFields';
import { APP_NAME, getApiErrorMessage, isEnabledPaymentProvider } from '@client-manager/shared';
import { showToast } from '../../../shared/utils/toast';

export const AdminSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: platformBillingApi.getSettings,
  });

  const [planName, setPlanName] = React.useState('');
  const [priceCents, setPriceCents] = React.useState('');
  const [paymentProvider, setPaymentProvider] = React.useState('mercadopago');
  const [paymentApiKey, setPaymentApiKey] = React.useState('');
  const [paymentWebhookToken, setPaymentWebhookToken] = React.useState('');
  const [overdueDays, setOverdueDays] = React.useState('7');
  const [whatsappProvider, setWhatsappProvider] = React.useState('evolution');
  const [whatsappInstanceUrl, setWhatsappInstanceUrl] = React.useState('');
  const [whatsappApiKey, setWhatsappApiKey] = React.useState('');

  React.useEffect(() => {
    if (!data) return;
    setPlanName(data.defaultPlan.name);
    setPriceCents(String(data.defaultPlan.priceCents / 100));
    setPaymentProvider(
      isEnabledPaymentProvider(data.payment.provider) ? data.payment.provider : 'mercadopago',
    );
    setPaymentWebhookToken('');
    setPaymentApiKey('');
    setOverdueDays(String(data.payment.overdueDays));
    setWhatsappProvider(data.whatsapp.provider);
    setWhatsappInstanceUrl(data.whatsapp.instanceUrl ?? '');
    setWhatsappApiKey('');
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      platformBillingApi.updateSettings({
        planName,
        priceCents: Math.round(parseFloat(priceCents.replace(',', '.')) * 100),
        paymentProvider,
        paymentApiKey: paymentApiKey || undefined,
        paymentWebhookToken: paymentWebhookToken || undefined,
        overdueDays: parseInt(overdueDays, 10),
        whatsappProvider,
        whatsappInstanceUrl,
        whatsappApiKey: whatsappApiKey || undefined,
      }),
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

  if (isLoading) {
    return (
      <div className="relative h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <PageLayout
      title="Configurações"
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-2xl space-y-8">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Preço do aplicativo (SaaS)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Valor mensal cobrado de cada revenda pelo uso do {APP_NAME}.
          </p>
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

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">PIX da plataforma</h2>
          <p className="mt-1 text-sm text-slate-500">
            Credenciais para receber pagamentos das revendas. Integração PSP em breve.
          </p>
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

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">WhatsApp da plataforma</h2>
          <p className="mt-1 text-sm text-slate-500">Opcional — avisos para revendas.</p>
          <div className="mt-4">
            <WhatsAppProviderFields
              whatsappProvider={whatsappProvider}
              whatsappInstanceUrl={whatsappInstanceUrl}
              whatsappApiKey={whatsappApiKey}
              onProviderChange={setWhatsappProvider}
              onInstanceUrlChange={setWhatsappInstanceUrl}
              onApiKeyChange={setWhatsappApiKey}
              apiKeyConfigured={data?.whatsapp.apiKeyConfigured}
            />
          </div>
        </section>
      </div>
    </PageLayout>
  );
};
