export function pickListFilters(
  query: Record<string, unknown>,
  keys: readonly string[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of keys) {
    const value = query[key];
    if (typeof value === 'string' && value.trim() !== '') {
      result[key] = value.trim();
    }
  }
  return result;
}
