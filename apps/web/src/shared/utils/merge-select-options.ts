export interface EntitySelectOption {
  id: string;
  name: string;
}

/**
 * Ensures currently selected entities remain visible in comboboxes even when
 * they are excluded from selectable-only API lists (e.g. inactive plan/server).
 */
export function mergeSelectOptions(
  options: EntitySelectOption[],
  selected: Array<EntitySelectOption | null | undefined>,
): EntitySelectOption[] {
  const merged = [...options];
  const seen = new Set(options.map((option) => option.id));

  for (const item of selected) {
    if (!item?.id || seen.has(item.id)) continue;
    merged.unshift(item);
    seen.add(item.id);
  }

  return merged;
}
