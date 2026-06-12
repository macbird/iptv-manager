import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MetaEmbeddedSignupInput, WhatsAppMetaConnectionDto } from '@client-manager/shared';
import { WHATSAPP_CONNECTION_STATUS_LABELS } from '@client-manager/shared';
import { tenantBillingApi } from '../../billing/api/billing.api';
import { getApiErrorMessage } from '@client-manager/shared';
import { showToast } from '../../../shared/utils/toast';

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (params: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      login: (
        callback: (response: { authResponse?: { code?: string } }) => void,
        options: Record<string, unknown>,
      ) => void;
    };
  }
}

interface MetaWhatsAppConnectProps {
  connection: WhatsAppMetaConnectionDto | null | undefined;
}

function loadFacebookSdk(appId: string, version: string): Promise<void> {
  if (window.FB) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB?.init({
        appId,
        cookie: true,
        xfbml: false,
        version,
      });
      resolve();
    };

    if (document.getElementById('facebook-jssdk')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.async = true;
    script.defer = true;
    script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
    script.onerror = () => reject(new Error('Falha ao carregar SDK da Meta'));
    document.body.appendChild(script);
  });
}

export const MetaWhatsAppConnect: React.FC<MetaWhatsAppConnectProps> = ({ connection }) => {
  const queryClient = useQueryClient();
  const signupSessionRef = React.useRef<{ wabaId?: string; phoneNumberId?: string }>({});
  const [isLaunching, setIsLaunching] = React.useState(false);

  const { data: metaConfig, isError: configError } = useQuery({
    queryKey: ['meta-whatsapp-config'],
    queryFn: tenantBillingApi.getMetaWhatsappConfig,
    retry: false,
  });

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') {
        return;
      }

      try {
        const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (payload?.type !== 'WA_EMBEDDED_SIGNUP') return;
        const data = payload.data ?? {};
        if (data.waba_id) signupSessionRef.current.wabaId = String(data.waba_id);
        if (data.phone_number_id) {
          signupSessionRef.current.phoneNumberId = String(data.phone_number_id);
        }
      } catch {
        // Ignore non-JSON postMessages from Facebook widgets.
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const connectMutation = useMutation({
    mutationFn: (payload: MetaEmbeddedSignupInput) => tenantBillingApi.connectMetaWhatsapp(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
      queryClient.invalidateQueries({ queryKey: ['meta-whatsapp-connection'] });
      showToast.success('WhatsApp Business conectado via Meta');
    },
    onError: (error: unknown) =>
      showToast.error(getApiErrorMessage(error, 'Falha ao conectar WhatsApp Meta')),
  });

  const disconnectMutation = useMutation({
    mutationFn: tenantBillingApi.disconnectMetaWhatsapp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
      queryClient.invalidateQueries({ queryKey: ['meta-whatsapp-connection'] });
      showToast.success('WhatsApp Meta desconectado');
    },
    onError: (error: unknown) =>
      showToast.error(getApiErrorMessage(error, 'Falha ao desconectar')),
  });

  const handleConnect = async () => {
    if (!metaConfig) {
      showToast.error('Integração Meta não configurada na plataforma');
      return;
    }

    setIsLaunching(true);
    signupSessionRef.current = {};

    try {
      await loadFacebookSdk(metaConfig.appId, metaConfig.graphApiVersion);

      window.FB?.login(
        (response) => {
          setIsLaunching(false);
          const code = response.authResponse?.code;
          const { wabaId, phoneNumberId } = signupSessionRef.current;

          if (!code || !wabaId || !phoneNumberId) {
            showToast.error('Cadastro incorporado incompleto. Tente novamente.');
            return;
          }

          connectMutation.mutate({ code, wabaId, phoneNumberId });
        },
        {
          config_id: metaConfig.configId,
          response_type: 'code',
          override_default_response_type: true,
          extras: {
            setup: {},
            featureType: '',
            sessionInfoVersion: '3',
          },
        },
      );
    } catch (error) {
      setIsLaunching(false);
      showToast.error(getApiErrorMessage(error, 'Erro ao iniciar Embedded Signup'));
    }
  };

  const status = connection?.connectionStatus ?? 'disconnected';
  const statusLabel =
    WHATSAPP_CONNECTION_STATUS_LABELS[
      status as keyof typeof WHATSAPP_CONNECTION_STATUS_LABELS
    ] ?? status;

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
      <div>
        <p className="text-sm font-medium text-slate-900">API oficial Meta (Tech Provider)</p>
        <p className="mt-1 text-xs text-slate-600">
          Cada tenant conecta a própria conta WhatsApp Business via Embedded Signup. O faturamento
          das mensagens é feito diretamente na Meta — sem custo repassado pela plataforma.
        </p>
      </div>

      {configError ? (
        <p className="text-sm text-amber-700">
          A plataforma ainda não configurou META_APP_ID / META_EMBEDDED_SIGNUP_CONFIG_ID no servidor.
        </p>
      ) : null}

      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Status</dt>
          <dd className="font-medium text-slate-900">{statusLabel}</dd>
        </div>
        {connection?.displayPhoneNumber ? (
          <div>
            <dt className="text-slate-500">Número</dt>
            <dd className="font-medium text-slate-900">{connection.displayPhoneNumber}</dd>
          </div>
        ) : null}
      </dl>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleConnect()}
          disabled={isLaunching || connectMutation.isPending || !metaConfig}
          className="rounded-md bg-[#1877F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#166FE5] disabled:opacity-50"
        >
          {isLaunching || connectMutation.isPending ? 'Conectando...' : 'Conectar WhatsApp Business'}
        </button>
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
    </div>
  );
};
