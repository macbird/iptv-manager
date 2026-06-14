import React from 'react';
import { Copy, HelpCircle } from 'lucide-react';
import {
  ENABLED_PAYMENT_PROVIDER_VALUES,
  PAYMENT_PROVIDER_FEE_HINTS,
  PAYMENT_PROVIDER_LABELS,
  type EnabledPaymentProviderValue,
  type TenantPaymentCredentialDto,
} from '@client-manager/shared';
import { SecretCredentialField } from './SecretCredentialField';
import { showToast } from '../../../shared/utils/toast';
import {
  MercadoPagoIntegrationHelpModal,
  type MercadoPagoHelpFocus,
} from './MercadoPagoIntegrationHelpModal';

export type PaymentCredentialFormState = TenantPaymentCredentialDto & {
  apiKey: string;
  webhookToken: string;
};

function emptyCredential(provider: EnabledPaymentProviderValue): PaymentCredentialFormState {
  return {
    provider,
    apiKey: '',
    webhookToken: '',
    apiKeyConfigured: false,
    webhookTokenConfigured: false,
    active: false,
  };
}

function mergeCredentials(
  fromApi: TenantPaymentCredentialDto[] | undefined,
): PaymentCredentialFormState[] {
  const byProvider = new Map(fromApi?.map((c) => [c.provider, c]));

  return ENABLED_PAYMENT_PROVIDER_VALUES.map((provider) => {
    const existing = byProvider.get(provider);
    if (!existing) return emptyCredential(provider);
    return {
      ...existing,
      apiKey: '',
      webhookToken: '',
    };
  });
}

export function buildCredentialFormState(
  fromApi: TenantPaymentCredentialDto[] | undefined,
): PaymentCredentialFormState[] {
  return mergeCredentials(fromApi);
}

export function resolveInitialPaymentProvider(
  _credentials?: TenantPaymentCredentialDto[] | undefined,
  _routingProvider?: EnabledPaymentProviderValue,
): EnabledPaymentProviderValue {
  return 'mercadopago';
}

interface PaymentCredentialsSectionProps {
  credentials: PaymentCredentialFormState[];
  onChange: (credentials: PaymentCredentialFormState[]) => void;
  mercadoPagoWebhookUrl?: string | null;
  mercadoPagoWebhookRequiresToken?: boolean;
  legacyProviderWarning?: boolean;
}

const ACTIVE_PROVIDER: EnabledPaymentProviderValue = 'mercadopago';

export const PaymentCredentialsSection: React.FC<PaymentCredentialsSectionProps> = ({
  credentials,
  onChange,
  mercadoPagoWebhookUrl,
  mercadoPagoWebhookRequiresToken = false,
  legacyProviderWarning = false,
}) => {
  const [helpModal, setHelpModal] = React.useState<{
    open: boolean;
    focus: MercadoPagoHelpFocus;
  }>({ open: false, focus: 'overview' });

  const openHelp = (focus: MercadoPagoHelpFocus = 'overview') => {
    setHelpModal({ open: true, focus });
  };
  const selected =
    credentials.find((item) => item.provider === ACTIVE_PROVIDER) ??
    emptyCredential(ACTIVE_PROVIDER);

  const updateSelected = (patch: Partial<PaymentCredentialFormState>) => {
    const exists = credentials.some((item) => item.provider === ACTIVE_PROVIDER);
    if (!exists) {
      onChange([...credentials, { ...emptyCredential(ACTIVE_PROVIDER), ...patch }]);
      return;
    }
    onChange(
      credentials.map((item) =>
        item.provider === ACTIVE_PROVIDER ? { ...item, ...patch } : item,
      ),
    );
  };

  const hint = PAYMENT_PROVIDER_FEE_HINTS[ACTIVE_PROVIDER];

  const copyWebhookUrl = () => {
    if (!mercadoPagoWebhookUrl) return;
    navigator.clipboard.writeText(mercadoPagoWebhookUrl);
    showToast.success('Endereço copiado');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-slate-600">
          Meio de pagamento para <strong>gerar PIX</strong> das faturas:{' '}
          <strong>Mercado Pago</strong>. Outros provedores serão habilitados em versões futuras.
        </p>
        <button
          type="button"
          onClick={() => openHelp('overview')}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-form-primary/30 bg-form-primary/5 px-3 py-2 text-xs font-semibold text-form-primary transition-colors hover:bg-form-primary/10"
        >
          <HelpCircle className="h-4 w-4" aria-hidden />
          Como integrar Mercado Pago?
        </button>
      </div>

      {legacyProviderWarning ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Esta conta ainda tem configuração de um meio de pagamento antigo. Salve novamente com
          Mercado Pago para ativar só ele.
        </p>
      ) : null}

      <div>
        <p className="block text-sm font-medium text-slate-700">Meio de pagamento</p>
        <p className="mt-2 inline-flex rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900">
          {PAYMENT_PROVIDER_LABELS.mercadopago}
        </p>
        <p className="mt-1.5 text-xs text-slate-500">
          {hint.label} — {hint.description}
        </p>
      </div>

      <div className="rounded-lg border border-form-primary/30 bg-form-primary/5/30 p-4">
        <h3 className="font-medium text-slate-900">{PAYMENT_PROVIDER_LABELS[ACTIVE_PROVIDER]}</h3>
        <p className="mt-0.5 text-xs text-slate-500">Dados para gerar PIX e receber confirmação de pagamento</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SecretCredentialField
            id={`payment-api-key-${ACTIVE_PROVIDER}`}
            label="API Key / Access Token"
            value={selected.apiKey}
            configured={selected.apiKeyConfigured}
            onChange={(apiKey) => updateSelected({ apiKey })}
            emptyPlaceholder="Cole o Access Token de produção (começa com APP_USR-)"
            configuredHint="Código salvo — não exibido por segurança"
          />
          <SecretCredentialField
            id={`payment-webhook-${ACTIVE_PROVIDER}`}
            label="Assinatura secreta (Webhook secret)"
            value={selected.webhookToken}
            configured={selected.webhookTokenConfigured}
            onChange={(webhookToken) => updateSelected({ webhookToken })}
            emptyPlaceholder="Cole o código de segurança do Mercado Pago"
            configuredHint="Código salvo — não exibido por segurança"
          />
        </div>

        <p className="mt-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
              No Mercado Pago, em <strong>Credenciais de produção</strong>, copie o{' '}
              <strong>Access Token</strong> (código longo que começa com <strong>APP_USR-</strong>) em{' '}
              <a
                href="https://www.mercadopago.com.br/developers/panel/app"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Suas integrações
              </a>
              . Não use a chave pública (Public Key) nem o usuário de teste (
              <strong>TESTUSER...</strong>).
            </p>

            {mercadoPagoWebhookUrl ? (
              <div className="mt-3 space-y-3 rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-3">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-emerald-900">Endereço para aviso de PIX pago</p>
                    <button
                      type="button"
                      onClick={() => openHelp('webhook')}
                      className="flex items-center gap-1 text-[11px] font-semibold text-form-primary hover:text-form-primary-hover"
                    >
                      <HelpCircle size={14} />
                      Como configurar?
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-800">
                    Copie e cadastre exatamente como aparece abaixo, no Mercado Pago.
                  </p>
                  <div className="mt-2 flex items-start gap-2">
                    <code className="flex-1 break-all font-mono text-[11px] text-emerald-950">
                      {mercadoPagoWebhookUrl}
                    </code>
                    <button
                      type="button"
                      onClick={copyWebhookUrl}
                      className="shrink-0 rounded p-1 text-emerald-700 hover:bg-emerald-100"
                      title="Copiar URL"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="rounded-md border border-emerald-200 bg-white/70 px-3 py-2.5 text-[11px] text-slate-700">
                  <p>
                    Passo a passo completo no guia{' '}
                    <button
                      type="button"
                      onClick={() => openHelp('webhook')}
                      className="font-semibold text-form-primary hover:underline"
                    >
                      Como integrar Mercado Pago?
                    </button>
                    .
                  </p>
                </div>

                <p className="text-[11px] text-slate-700">
                  Depois de salvar no Mercado Pago, copie o <strong>código de segurança</strong>{' '}
                  (assinatura secreta) e cole no campo acima.
                </p>

                {mercadoPagoWebhookRequiresToken ? (
                  <p className="text-[11px] text-emerald-800">
                    Código de segurança configurado. Pagamentos só serão confirmados com aviso
                    válido do Mercado Pago.
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-800">
                    Sem o código de segurança, o sistema aceita qualquer aviso de pagamento. Configure
                    em produção para maior proteção.
                  </p>
                )}

                <p className="text-[11px] text-slate-600">
                  Se este endereço mudar no futuro, atualize também no painel do Mercado Pago.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-amber-700">
                Endereço indisponível no momento. Recarregue a página ou fale com quem administra o
                sistema.
              </p>
            )}

        {!selected.apiKeyConfigured ? (
              <p className="mt-3 text-xs text-amber-700">
                Informe o código de acesso e clique em <strong>Salvar</strong> no fim da página.
              </p>
        ) : null}
      </div>

      <MercadoPagoIntegrationHelpModal
        isOpen={helpModal.open}
        onClose={() => setHelpModal((current) => ({ ...current, open: false }))}
        webhookUrl={mercadoPagoWebhookUrl}
        focus={helpModal.focus}
      />
    </div>
  );
};
