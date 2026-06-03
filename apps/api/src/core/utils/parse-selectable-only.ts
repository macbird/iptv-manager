import { parseSelectableOnly } from '@client-manager/shared';

export function isSelectableOnlyQuery(query: Record<string, unknown>): boolean {
  return parseSelectableOnly(query.selectableOnly);
}
