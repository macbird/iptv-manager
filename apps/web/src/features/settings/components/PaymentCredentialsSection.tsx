import React from 'react';
import { Copy, HelpCircle } from 'lucide-react';
import {
  PAYMENT_PROVIDER_FEE_HINTS,
  PAYMENT_PROVIDER_LABELS,
  PAYMENT_PROVIDER_VALUES,
  type PaymentProviderValue,
  type TenantPaymentCredentialDto,
} from '@client-manager/shared';
import { SecretCredentialField } from './SecretCredentialField';
import { showToast } from '../../../shared/utils/toast';
import { WebhookHelpModal } from './WebhookHelpModal';

export type PaymentCredentialFormState = TenantPaymentCredentialDto & {
  apiKey: string;
  webhookToken: string;
};

function emptyCredential(provider: PaymentProviderValue): PaymentCredentialFormState {
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

  return PAYMENT_PROVIDER_VALUES.map((provider) => {
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
  credentials: TenantPaymentCredentialDto[] | undefined,
  routingProvider?: PaymentProviderValue,
): PaymentProviderValue {
  const active = credentials?.find((item) => item.active);
  if (active) {
    return active.provider as PaymentProviderValue;
  }
  return routingProvider ?? 'mercadopago';
}

interface PaymentCredentialsSectionProps {
  selectedProvider: PaymentProviderValue;
  onProviderChange: (provider: PaymentProviderValue) => void;
  credentials: PaymentCredentialFormState[];
  onChange: (credentials: PaymentCredentialFormState[]) => void;
  mercadoPagoWebhookUrl?: string | null;
  mercadoPagoWebhookRequiresToken?: boolean;
}

export const PaymentCredentialsSection: React.FC<PaymentCredentialsSectionProps> = ({
  selectedProvider,
  onProviderChange,
  credentials,
  onChange,
  mercadoPagoWebhookUrl,
  mercadoPagoWebhookRequiresToken = false,
}) => {
  const [isHelpModalOpen, setIsHelpModalOpen] = React.useState(false);
  const selected =
    credentials.find((item) => item.provider === selectedProvider) ??
    emptyCredential(selectedProvider);

  const updateSelected = (patch: Partial<PaymentCredentialFormState>) => {
    const exists = credentials.some((item) => item.provider === selectedProvider);
    if (!exists) {
      onChange([...credentials, { ...emptyCredential(selectedProvider), ...patch }]);
      return;
    }
    onChange(
      credentials.map((item) =>
        item.provider === selectedProvider ? { ...item, ...patch } : item,
      ),
    );
  };

  const hint = PAYMENT_PROVIDER_FEE_HINTS[selectedProvider];

  const copyWebhookUrl = () => {
    if (!mercadoPagoWebhookUrl) return;
    navigator.clipboard.writeText(mercadoPagoWebhookUrl);
    showToast.success('URL do webhook copiada');
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Escolha o meio de pagamento para <strong>gerar PIX</strong> das faturas. Depois cadastre a
        API key e o token do webhook desse meio.
      </p>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="payment-provider">
          Meio de pagamento
        </label>
        <select
          id="payment-provider"
          value={selectedProvider}
          onChange={(e) => onProviderChange(e.target.value as PaymentProviderValue)}
          className="mt-2 block w-full max-w-md rounded-md border border-slate-300 p-2.5 text-sm shadow-sm"
        >
          {PAYMENT_PROVIDER_VALUES.map((value) => (
            <option key={value} value={value}>
              {PAYMENT_PROVIDER_LABELS[value]}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-slate-500">
          {hint.label} — {hint.description}
        </p>
      </div>

      <div className="rounded-lg border border-indigo-200 bg-indigo-50/30 p-4">
        <h3 className="font-medium text-slate-900">{PAYMENT_PROVIDER_LABELS[selectedProvider]}</h3>
        <p className="mt-0.5 text-xs text-slate-500">Credenciais para integração com o PIX</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SecretCredentialField
            id={`payment-api-key-${selectedProvider}`}
            label="API Key / Access Token"
            value={selected.apiKey}
            configured={selected.apiKeyConfigured}
            onChange={(apiKey) => updateSelected({ apiKey })}
            emptyPlaceholder="Cole o Access Token (ex.: TEST-...)"
            configuredHint="Access token salvo — não exibido por segurança"
          />
          <SecretCredentialField
            id={`payment-webhook-${selectedProvider}`}
            label={selectedProvider === 'mercadopago' ? 'Assinatura secreta (Webhook secret)' : 'Token do webhook'}
            value={selected.webhookToken}
            configured={selected.webhookTokenConfigured}
            onChange={(webhookToken) => updateSelected({ webhookToken })}
            emptyPlaceholder={selectedProvider === 'mercadopago' ? 'Cole o secret do painel MP' : 'Opcional'}
            configuredHint="Secret salvo — não exibido por segurança"
          />
        </div>

        {selectedProvider === 'mercadopago' ? (
          <>
            <p className="mt-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
              Mercado Pago: copie o <strong>Access Token</strong> (token longo) em{' '}
              <a
                href="https://www.mercadopago.com.br/developers/panel/app"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Developers → Suas integrações → Credenciais
              </a>
              . Não use a <strong>Public Key</strong> (UUID curto) nem o usuário{' '}
              <code className="font-mono">TESTUSER...</code>.
            </p>

            {mercadoPagoWebhookUrl ? (
              <div className="mt-3 space-y-3 rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-3">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-emerald-900">URL do webhook (PIX pago)</p>
                    <button
                      type="button"
                      onClick={() => setIsHelpModalOpen(true)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-800"
                    >
                      <HelpCircle size={14} />
                      Como configurar?
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-800">
                    A URL usa o <strong>ID da sua conta</strong> (não o nome do tenant). Copie e
                    cadastre exatamente como aparece abaixo.
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

                <div className="rounded-md border border-emerald-200 bg-white/70 px-3 py-2.5">
                  <p className="text-xs font-semibold text-slate-900">
                    Como configurar no Mercado Pago
                  </p>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[11px] text-slate-700">
                    <li>
                      Acesse{' '}
                      <a
                        href="https://www.mercadopago.com.br/developers/panel/app"
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-700 underline"
                      >
                        Mercado Pago Developers
                      </a>{' '}
                      e abra a mesma aplicação do Access Token acima.
                    </li>
                    <li>
                      Vá em <strong>Webhooks</strong> (ou <strong>Notificações</strong> →{' '}
                      <strong>Webhooks</strong>).
                    </li>
                    <li>
                      Clique em <strong>Configurar notificações</strong> ou{' '}
                      <strong>Adicionar URL</strong>.
                    </li>
                    <li>
                      Cole a URL copiada acima no campo <strong>URL de produção</strong> (ou URL de
                      teste, se estiver em sandbox).
                    </li>
                    <li>
                      Marque o evento <strong>Payments</strong> (pagamentos).
                    </li>
                    <li>
                      Salve. O Mercado Pago pode enviar um GET de verificação — a API responde
                      automaticamente.
                    </li>
                    <li>
                      Gere um PIX de teste e pague. A fatura deve mudar para <strong>paga</strong>{' '}
                      em alguns segundos.
                    </li>
                  </ol>
                </div>

                <p className="text-[11px] text-slate-700">
                  No painel do Mercado Pago, copie a <strong>assinatura secreta</strong> gerada ao
                  salvar o webhook e cole no campo acima. A API valida o header{' '}
                  <code className="font-mono">x-signature</code> em cada notificação de pagamento.
                </p>

                {mercadoPagoWebhookRequiresToken ? (
                  <p className="text-[11px] text-emerald-800">
                    Assinatura secreta configurada. Notificações sem assinatura válida serão
                    rejeitadas.
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-800">
                    Sem assinatura secreta, a API aceita notificações sem validar origem (útil para
                    teste). Em produção, configure o secret.
                  </p>
                )}

                <p className="text-[11px] text-slate-600">
                  Se a URL mudar (ex.: novo túnel da API), atualize no painel do Mercado Pago. A URL
                  exibida aqui sempre reflete o endereço público atual da API.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-amber-700">
                URL do webhook indisponível — verifique se a API está com{' '}
                <code className="font-mono">API_PUBLIC_BASE_URL</code> configurada.
              </p>
            )}
          </>
        ) : null}
        {!selected.apiKeyConfigured ? (
          <p className="mt-3 text-xs text-amber-700">
            Informe a API key e clique em <strong>Salvar</strong> no fim da página.
          </p>
        ) : null}
      </div>

      <WebhookHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        webhookUrl={mercadoPagoWebhookUrl ?? ''}
      />
    </div>
  );
};
