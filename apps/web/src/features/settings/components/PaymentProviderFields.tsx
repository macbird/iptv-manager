import React from 'react';
import {
  PAYMENT_PROVIDER_LABELS,
  PAYMENT_PROVIDER_VALUES,
  WHATSAPP_PROVIDER_LABELS,
  WHATSAPP_PROVIDER_VALUES,
} from '@client-manager/shared';

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
      <label className="block text-sm font-medium text-slate-700">Provider PIX</label>
      <select
        value={paymentProvider}
        onChange={(e) => onPaymentProviderChange(e.target.value)}
        className="mt-1 block w-full max-w-md rounded-md border border-slate-300 p-2 shadow-sm"
      >
        {PAYMENT_PROVIDER_VALUES.map((v) => (
          <option key={v} value={v}>
            {PAYMENT_PROVIDER_LABELS[v]}
          </option>
        ))}
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700">API Key</label>
      <input
        type="password"
        value={paymentApiKey}
        onChange={(e) => onPaymentApiKeyChange(e.target.value)}
        placeholder={apiKeyConfigured ? '•••••••• (deixe vazio para manter)' : 'Cole a API key do sandbox'}
        className="mt-1 block w-full max-w-lg rounded-md border border-slate-300 p-2 shadow-sm font-mono text-sm"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700">Token do webhook</label>
      <input
        type="password"
        value={paymentWebhookToken}
        onChange={(e) => onPaymentWebhookTokenChange(e.target.value)}
        placeholder={webhookConfigured ? '•••••••• (deixe vazio para manter)' : 'Opcional'}
        className="mt-1 block w-full max-w-lg rounded-md border border-slate-300 p-2 shadow-sm font-mono text-sm"
      />
    </div>
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
}

export const WhatsAppProviderFields: React.FC<WhatsAppProviderFieldsProps> = ({
  whatsappProvider,
  whatsappInstanceUrl,
  whatsappApiKey,
  onProviderChange,
  onInstanceUrlChange,
  onApiKeyChange,
  apiKeyConfigured,
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
    <div>
      <label className="block text-sm font-medium text-slate-700">URL da instância</label>
      <input
        type="url"
        value={whatsappInstanceUrl}
        onChange={(e) => onInstanceUrlChange(e.target.value)}
        placeholder="https://evolution.seudominio.com"
        className="mt-1 block w-full max-w-lg rounded-md border border-slate-300 p-2 shadow-sm"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700">API Key / Token</label>
      <input
        type="password"
        value={whatsappApiKey}
        onChange={(e) => onApiKeyChange(e.target.value)}
        placeholder={apiKeyConfigured ? '•••••••• (deixe vazio para manter)' : 'Token da instância'}
        className="mt-1 block w-full max-w-lg rounded-md border border-slate-300 p-2 shadow-sm font-mono text-sm"
      />
    </div>
  </div>
);
