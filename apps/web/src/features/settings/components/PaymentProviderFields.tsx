import React from 'react';
import {
  PAYMENT_PROVIDER_LABELS,
  WHATSAPP_PROVIDER_LABELS,
  WHATSAPP_PROVIDER_VALUES,
  type WhatsAppMetaConnectionDto,
  type WhatsAppEvolutionConnectionDto,
} from '@client-manager/shared';
import { SecretCredentialField } from './SecretCredentialField';
import { MetaWhatsAppConnect } from './MetaWhatsAppConnect';
import { EvolutionWhatsAppConnect } from './EvolutionWhatsAppConnect';

interface PaymentProviderFieldsProps {
  paymentApiKey: string;
  paymentWebhookToken: string;
  onPaymentApiKeyChange: (v: string) => void;
  onPaymentWebhookTokenChange: (v: string) => void;
  apiKeyConfigured?: boolean;
  webhookConfigured?: boolean;
}

export const PaymentProviderFields: React.FC<PaymentProviderFieldsProps> = ({
  paymentApiKey,
  paymentWebhookToken,
  onPaymentApiKeyChange,
  onPaymentWebhookTokenChange,
  apiKeyConfigured,
  webhookConfigured,
}) => (
  <div className="space-y-4">
    <div>
      <p className="block text-sm font-medium text-slate-700">Provider PIX</p>
      <p className="mt-1 inline-flex rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900">
        {PAYMENT_PROVIDER_LABELS.mercadopago}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Apenas Mercado Pago está habilitado nesta versão.
      </p>
    </div>
    <SecretCredentialField
      id="platform-payment-api-key"
      label="API Key / Access Token"
      value={paymentApiKey}
      configured={Boolean(apiKeyConfigured)}
      onChange={onPaymentApiKeyChange}
      emptyPlaceholder="Cole o Access Token do sandbox"
    />
    <SecretCredentialField
      id="platform-payment-webhook"
      label="Token do webhook"
      value={paymentWebhookToken}
      configured={Boolean(webhookConfigured)}
      onChange={onPaymentWebhookTokenChange}
      emptyPlaceholder="Opcional"
    />
  </div>
);

interface WhatsAppProviderFieldsProps {
  whatsappProvider: string;
  whatsappInstanceUrl: string;
  whatsappApiKey: string;
  onProviderChange: (v: string) => void;
  onInstanceUrlChange: (v: string) => void;
  onApiKeyChange: (v: string) => void;
  apiKeyConfigured?: boolean;
  metaConnection?: WhatsAppMetaConnectionDto | null;
  evolutionConnection?: WhatsAppEvolutionConnectionDto | null;
  /** Platform admin settings use simple credential fields (no tenant Evolution/Meta flows). */
  variant?: 'tenant' | 'platform';
}

export const WhatsAppProviderFields: React.FC<WhatsAppProviderFieldsProps> = ({
  whatsappProvider,
  whatsappInstanceUrl,
  whatsappApiKey,
  onProviderChange,
  onInstanceUrlChange,
  onApiKeyChange,
  apiKeyConfigured,
  metaConnection,
  evolutionConnection,
  variant = 'tenant',
}) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-slate-700">Provider WhatsApp</label>
      <select
        value={whatsappProvider}
        onChange={(e) => onProviderChange(e.target.value)}
        className="mt-1 block w-full max-w-md rounded-md border border-slate-300 p-2 shadow-sm"
      >
        {WHATSAPP_PROVIDER_VALUES.map((v) => (
          <option key={v} value={v}>
            {WHATSAPP_PROVIDER_LABELS[v]}
          </option>
        ))}
      </select>
    </div>

    {variant === 'platform' ? (
      <>
        <div>
          <label className="block text-sm font-medium text-slate-700">URL da instância</label>
          <input
            value={whatsappInstanceUrl}
            onChange={(e) => onInstanceUrlChange(e.target.value)}
            placeholder="https://evolution.exemplo.com"
            className="mt-1 block w-full rounded-md border border-slate-300 p-2 shadow-sm"
          />
        </div>
        <SecretCredentialField
          id="platform-whatsapp-api-key"
          label="API Key"
          value={whatsappApiKey}
          configured={Boolean(apiKeyConfigured)}
          onChange={onApiKeyChange}
          emptyPlaceholder="Cole a API Key da instância"
        />
      </>
    ) : whatsappProvider === 'meta' ? (
      <MetaWhatsAppConnect connection={metaConnection ?? null} />
    ) : (
      <EvolutionWhatsAppConnect connection={evolutionConnection ?? null} />
    )}

    <p className="text-xs text-slate-500">
      {variant === 'platform'
        ? 'Credenciais globais da plataforma para avisos às revendas.'
        : 'Cobranças de fatura podem ser enviadas por WhatsApp. Com Evolution, conecte o número do seu negócio abaixo. Com Meta, cada revendedor conecta a própria conta via Embedded Signup.'}
    </p>
  </div>
);
