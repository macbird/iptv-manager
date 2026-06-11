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
  paymentProvider: string;
  paymentApiKey: string;
  paymentWebhookToken: string;
  onPaymentProviderChange: (v: string) => void;
  onPaymentApiKeyChange: (v: string) => void;
  onPaymentWebhookTokenChange: (v: string) => void;
  apiKeyConfigured?: boolean;
  webhookConfigured?: boolean;
}

export const PaymentProviderFields: React.FC<PaymentProviderFieldsProps> = ({
  paymentProvider,
  paymentApiKey,
  paymentWebhookToken,
  onPaymentProviderChange,
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

    {whatsappProvider === 'meta' ? (
      <MetaWhatsAppConnect connection={metaConnection ?? null} />
    ) : (
      <EvolutionWhatsAppConnect connection={evolutionConnection ?? null} />
    )}

    <p className="text-xs text-slate-500">
      Cobranças de fatura podem ser enviadas por WhatsApp. Com Evolution, conecte o número do seu
      negócio abaixo. Com Meta, cada revendedor conecta a própria conta via Embedded Signup.
    </p>
  </div>
);
