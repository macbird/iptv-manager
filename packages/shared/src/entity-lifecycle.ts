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
