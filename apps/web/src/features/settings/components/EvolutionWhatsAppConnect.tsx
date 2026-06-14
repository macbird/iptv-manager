import React from 'react';
import { Copy, Check } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WhatsAppEvolutionConnectionDto } from '@client-manager/shared';
import { WHATSAPP_CONNECTION_STATUS_LABELS, normalizePhoneE164 } from '@client-manager/shared';
import { tenantBillingApi, platformBillingApi } from '../../billing/api/billing.api';
import { getApiErrorMessage } from '@client-manager/shared';
import { showToast } from '../../../shared/utils/toast';
import { primaryButtonClass } from '../../../shared/ui/buttons/button-styles';

type WhatsappSettingsScope = 'tenant' | 'platform';

interface EvolutionWhatsAppConnectProps {
  connection: WhatsAppEvolutionConnectionDto | null | undefined;
  scope?: WhatsappSettingsScope;
}

function toQrSrc(base64: string): string {
  return base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
}

function normalizePhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return normalizePhoneE164(digits);
}

function formatPairingCodeDisplay(code: string): string {
  const normalized = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (normalized.length === 8) {
    return `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
  }
  return normalized;
}

export const EvolutionWhatsAppConnect: React.FC<EvolutionWhatsAppConnectProps> = ({
  connection,
  scope = 'tenant',
}) => {
  const billingApi = scope === 'platform' ? platformBillingApi : tenantBillingApi;
  const connectionQueryKey =
    scope === 'platform' ? 'platform-evolution-whatsapp-connection' : 'evolution-whatsapp-connection';
  const settingsQueryKey = scope === 'platform' ? 'platform-settings' : 'tenant-settings';
  const queryClient = useQueryClient();
  const [phone, setPhone] = React.useState('');
  const [testPhone, setTestPhone] = React.useState('');
  const [usePairingCode, setUsePairingCode] = React.useState(false);
  const [qrCodeBase64, setQrCodeBase64] = React.useState<string | null>(null);
  const [pairingCode, setPairingCode] = React.useState<string | null>(null);
  const [pairingCodeCopied, setPairingCodeCopied] = React.useState(false);

  const {
    data: liveConnection,
    isError: connectionQueryError,
    error: connectionError,
    isLoading: connectionLoading,
  } = useQuery({
    queryKey: [connectionQueryKey],
    queryFn: billingApi.getEvolutionWhatsappConnection,
    refetchInterval: (query) =>
      query.state.data?.connectionStatus === 'pending' ? 3000 : false,
    initialData: connection ?? undefined,
    retry: 1,
  });

  const connectionErrorMessage = React.useMemo(() => {
    if (!connectionQueryError) return null;
    const axiosError = connectionError as { response?: { status?: number; data?: { message?: string } } };
    const status = axiosError?.response?.status;
    const apiMessage = axiosError?.response?.data?.message;

    if (status === 401) {
      return 'Sessão expirada. Faça login novamente em /login.';
    }
    if (status === 503) {
      return 'Evolution não configurada no servidor (EVOLUTION_BASE_URL / EVOLUTION_API_KEY).';
    }
    if (apiMessage) {
      return apiMessage;
    }
    return 'Não foi possível carregar o status do WhatsApp. Verifique se a API está acessível.';
  }, [connectionQueryError, connectionError]);

  const status = liveConnection?.connectionStatus ?? 'disconnected';
  const statusLabel =
    WHATSAPP_CONNECTION_STATUS_LABELS[
      status as keyof typeof WHATSAPP_CONNECTION_STATUS_LABELS
    ] ?? status;

  React.useEffect(() => {
    if (status === 'connected') {
      setQrCodeBase64(null);
      setPairingCode(null);
      setPairingCodeCopied(false);
    }
  }, [status]);

  const handleCopyPairingCode = async () => {
    if (!pairingCode) return;
    const normalized = pairingCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    await navigator.clipboard.writeText(normalized);
    setPairingCodeCopied(true);
    showToast.success('Código copiado — cole no WhatsApp sem hífen');
    window.setTimeout(() => setPairingCodeCopied(false), 2000);
  };

  const connectMutation = useMutation({
    mutationFn: () => {
      const digits = phone.replace(/\D/g, '');
      const normalized = digits ? normalizePhoneInput(digits) : '';
      return billingApi.connectEvolutionWhatsapp(
        usePairingCode && normalized ? { phone: normalized } : undefined,
      );
    },
    onSuccess: (data) => {
      setQrCodeBase64(data.qrCodeBase64);
      setPairingCode(data.pairingCode);
      queryClient.invalidateQueries({ queryKey: [connectionQueryKey] });
      queryClient.invalidateQueries({ queryKey: [settingsQueryKey] });

      if (data.connectionStatus === 'connected') {
        showToast.success('WhatsApp já estava conectado');
        return;
      }

      if (data.qrCodeBase64) {
        showToast.success('QR gerado — escaneie no celular');
      } else if (data.pairingCode) {
        showToast.success('Código gerado — digite no WhatsApp');
      } else if (data.connectionStatus === 'pending') {
        showToast.info(
          'Aguardando pareamento. Se o QR não aparecer em ~10s, clique em Atualizar QR / código.',
        );
      } else {
        showToast.info('Aguardando pareamento…');
      }
    },
    onError: (error: unknown) => showToast.error(getApiErrorMessage(error, 'Falha ao conectar')),
  });

  const disconnectMutation = useMutation({
    mutationFn: billingApi.disconnectEvolutionWhatsapp,
    onSuccess: () => {
      setQrCodeBase64(null);
      setPairingCode(null);
      queryClient.invalidateQueries({ queryKey: [connectionQueryKey] });
      queryClient.invalidateQueries({ queryKey: [settingsQueryKey] });
      showToast.success('WhatsApp desconectado');
    },
    onError: (error: unknown) => showToast.error(getApiErrorMessage(error, 'Falha ao desconectar')),
  });

  const testMutation = useMutation({
    mutationFn: () => {
      const digits = testPhone.replace(/\D/g, '');
      const normalized = digits ? normalizePhoneInput(digits) : undefined;
      return billingApi.sendEvolutionTestMessage(
        normalized ? { phone: normalized } : undefined,
      );
    },
    onSuccess: (data) => {
      showToast.success(`Mensagem de teste enviada para ${data.sentTo}`);
    },
    onError: (error: unknown) => showToast.error(getApiErrorMessage(error, 'Falha ao enviar teste')),
  });

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
      <div>
        <p className="text-sm font-medium text-slate-900">Evolution API (Baileys)</p>
        <p className="mt-1 text-xs text-slate-600">
          Conecte o WhatsApp do seu negócio escaneando o QR ou usando o código de pareamento. A
          plataforma gerencia a instância — você não precisa de API key.
        </p>
      </div>

      {connectionErrorMessage ? (
        <p className="text-sm text-amber-700">{connectionErrorMessage}</p>
      ) : null}

      {connectionLoading && !liveConnection ? (
        <p className="text-sm text-slate-500">Carregando status do WhatsApp…</p>
      ) : null}

      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Status</dt>
          <dd className="font-medium text-slate-900">{statusLabel}</dd>
        </div>
        {liveConnection?.instanceName ? (
          <div>
            <dt className="text-slate-500">Instância</dt>
            <dd className="font-medium text-slate-900">{liveConnection.instanceName}</dd>
          </div>
        ) : null}
        {liveConnection?.displayPhoneNumber ? (
          <div>
            <dt className="text-slate-500">Número conectado</dt>
            <dd className="font-medium text-slate-900">{liveConnection.displayPhoneNumber}</dd>
          </div>
        ) : null}
      </dl>

      {status !== 'connected' ? (
        <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={usePairingCode}
              onChange={(e) => setUsePairingCode(e.target.checked)}
            />
            Usar código de pareamento (em vez de QR)
          </label>

          {usePairingCode ? (
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Seu número (DDD + número — o 55 é adicionado automaticamente)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                onBlur={() => {
                  if (phone.trim()) setPhone(normalizePhoneInput(phone));
                }}
                placeholder="359998415212"
                className="mt-1 block w-full max-w-sm rounded-md border border-slate-300 p-2 text-sm shadow-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                No WhatsApp: Aparelhos conectados → Conectar com número de telefone → digite o
                código exibido abaixo.
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              No WhatsApp: Aparelhos conectados → Conectar um aparelho → escaneie o QR abaixo.
            </p>
          )}

          {qrCodeBase64 && !usePairingCode ? (
            <div className="inline-block rounded-md bg-white p-3 shadow-sm">
              <img
                src={toQrSrc(qrCodeBase64)}
                alt="QR Code WhatsApp"
                className="h-56 w-56 object-contain"
              />
            </div>
          ) : null}

          {pairingCode ? (
            <div className="rounded-md bg-emerald-50 px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Código de pareamento</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <p className="font-mono text-2xl font-bold tracking-widest text-emerald-900">
                  {formatPairingCodeDisplay(pairingCode)}
                </p>
                <button
                  type="button"
                  onClick={handleCopyPairingCode}
                  className="rounded-md p-2 text-emerald-700 transition-colors hover:bg-emerald-100"
                  title="Copiar código"
                  aria-label="Copiar código de pareamento"
                >
                  {pairingCodeCopied ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-emerald-700">
                Digite no WhatsApp exatamente como copiado (sem hífen). O código expira em cerca de 1
                minuto — use o mesmo número informado acima.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {status !== 'connected' ? (
          <button
            type="button"
            onClick={() => connectMutation.mutate()}
            disabled={
              connectMutation.isPending ||
              connectionQueryError ||
              (usePairingCode && phone.trim().length < 10)
            }
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {connectMutation.isPending
              ? 'Gerando...'
              : qrCodeBase64 || pairingCode
                ? 'Atualizar QR / código'
                : 'Conectar WhatsApp'}
          </button>
        ) : null}

        {status === 'connected' ? (
          <button
            type="button"
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Desconectar
          </button>
        ) : null}
      </div>

      {status === 'connected' ? (
        <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
          <p className="text-sm font-medium text-slate-900">Testar envio</p>
          <div>
            <label className="block text-xs text-slate-600">
              Número de destino
              {scope === 'tenant'
                ? ' (opcional — usa o telefone da conta se vazio; 55 automático)'
                : ' (obrigatório; 55 automático)'}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ''))}
              onBlur={() => {
                if (testPhone.trim()) setTestPhone(normalizePhoneInput(testPhone));
              }}
              placeholder="359998415212"
              className="mt-1 block w-full max-w-sm rounded-md border border-slate-300 p-2 text-sm shadow-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending || (scope === 'platform' && testPhone.trim().length < 10)}
            className={primaryButtonClass}
          >
            {testMutation.isPending ? 'Enviando...' : 'Enviar mensagem de teste'}
          </button>
        </div>
      ) : null}
    </div>
  );
};
