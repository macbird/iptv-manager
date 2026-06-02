import type { ConnectionRenewalStatusValue } from './activation-enums';

export interface ActivationListItem {
  id: string;
  status: ConnectionRenewalStatusValue;
  paidAt: string;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    expiresAt: string | null;
  };
  connection: {
    id: string;
    macAddress: string;
    applicationName: string;
    label: string | null;
    server: { id: string; name: string };
  };
  payment: {
    id: string;
    amountCents: number;
    method: string;
    paidAt: string;
  };
  invoice: { id: string; billingCycleKey: string } | null;
}
