/** Unified status for entities removed from active use (not deleted). */
export const ENTITY_INACTIVE_STATUS = 'inactive' as const;
export const ENTITY_ACTIVE_STATUS = 'active' as const;

export type EntityLifecycleStatus = typeof ENTITY_ACTIVE_STATUS | typeof ENTITY_INACTIVE_STATUS;

export const ENTITY_LIFECYCLE_LABELS: Record<EntityLifecycleStatus, string> = {
  active: 'Ativo',
  inactive: 'Desativado',
};

export function parseSelectableOnly(value: unknown): boolean {
  return value === 'true' || value === '1' || value === true;
}

export function isSelectableCustomerStatus(status: string): boolean {
  return status !== ENTITY_INACTIVE_STATUS;
}

export function isSelectablePlanStatus(status: string): boolean {
  return status === ENTITY_ACTIVE_STATUS;
}

export function isSelectableServerStatus(status: string): boolean {
  return status === ENTITY_ACTIVE_STATUS;
}

export function getPlanListStatusLabel(status: string): string {
  return status === ENTITY_INACTIVE_STATUS
    ? ENTITY_LIFECYCLE_LABELS.inactive
    : ENTITY_LIFECYCLE_LABELS.active;
}

export function getPlanListStatusBadgeClass(status: string): string {
  return status === ENTITY_INACTIVE_STATUS
    ? 'bg-slate-100 text-slate-500'
    : 'bg-green-100 text-green-700';
}

const SERVER_LIST_STATUS_LABELS: Record<string, string> = {
  active: ENTITY_LIFECYCLE_LABELS.active,
  maintenance: 'Manutenção',
  full: 'Lotado',
  inactive: ENTITY_LIFECYCLE_LABELS.inactive,
};

const SERVER_LIST_STATUS_BADGE_CLASSES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  maintenance: 'bg-amber-100 text-amber-700',
  full: 'bg-orange-100 text-orange-700',
  inactive: 'bg-slate-100 text-slate-500',
};

export function getServerListStatusLabel(status: string): string {
  return SERVER_LIST_STATUS_LABELS[status] ?? status;
}

export function getServerListStatusBadgeClass(status: string): string {
  return SERVER_LIST_STATUS_BADGE_CLASSES[status] ?? 'bg-slate-100 text-slate-700';
}
