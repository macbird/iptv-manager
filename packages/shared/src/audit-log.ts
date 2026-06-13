export const AUDIT_ACTION_LABELS: Record<string, string> = {
  'customer.created': 'Cliente criado',
  'customer.updated': 'Cliente atualizado',
  'customer.deactivated': 'Cliente desativado',
  'customer.activated': 'Cliente reativado',
  'payment.confirmed': 'Pagamento confirmado',
  'invoice.charge_sent': 'Cobrança WhatsApp enviada',
  'activation.completed': 'Ativação concluída no servidor',
};

export interface AuditLogListItem {
  id: string;
  entityType: string;
  action: string;
  actionLabel: string;
  entityId: string | null;
  actorName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
