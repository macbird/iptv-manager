import React from 'react';
import { TriangleAlert } from 'lucide-react';
import { getCustomerConfigurationWarningDetails } from '@client-manager/shared';

interface CustomerConfigurationWarningBannerProps {
  plan?: { name: string; status: string } | null;
  connections?: Array<{ server?: { name: string; status: string } | null }>;
}

export const CustomerConfigurationWarningBanner: React.FC<
  CustomerConfigurationWarningBannerProps
> = ({ plan, connections }) => {
  const messages = getCustomerConfigurationWarningDetails({ plan, connections });

  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <div className="flex items-start gap-2">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
        <div className="space-y-1.5">
          <p className="font-semibold">Configuração inconsistente</p>
          <ul className="list-disc space-y-1 pl-4 text-amber-900/90">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
