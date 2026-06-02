export const CONNECTION_RENEWAL_STATUS_VALUES = ['pending', 'completed', 'cancelled'] as const;
export type ConnectionRenewalStatusValue = (typeof CONNECTION_RENEWAL_STATUS_VALUES)[number];

export const CONNECTION_RENEWAL_STATUS_LABELS: Record<ConnectionRenewalStatusValue, string> = {
  pending: 'Pendente',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

export function getConnectionRenewalStatusBadgeClass(status: ConnectionRenewalStatusValue): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700';
    case 'cancelled':
      return 'bg-slate-100 text-slate-600';
    default:
      return 'bg-amber-100 text-amber-800';
  }
}
