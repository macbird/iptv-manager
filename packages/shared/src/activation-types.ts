import type { ConnectionRenewalStatusValue } from './activation-enums';

export interface ActivationListItem {
  id: string;
  status: ConnectionRenewalStatusValue;
  paidAt: string;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  connectionCount: number;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    expiresAt: string | null;
  };
  payment: {
    id: string;
    amountCents: number;
    method: string;
    paidAt: string;
  };
  invoice: { id: string; billingCycleKey: string } | null;
}

export interface ActivationConnectionDetail {
  id: string;
  label: string | null;
  macAddress: string;
  applicationName: string;
  m3u8Link: string | null;
  server: {
    id: string;
    name: string;
    panelUrl: string;
    panelUsername: string | null;
    panelPassword: string | null;
    panelNotes: string | null;
  };
}

export interface ActivationDetail extends ActivationListItem {
  connections: ActivationConnectionDetail[];
}
