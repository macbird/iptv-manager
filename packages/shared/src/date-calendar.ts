/**
 * Returns local calendar midnight for date comparison (ignores time-of-day).
 */
export function startOfLocalCalendarDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * True when the calendar day of `value` is strictly before today (local timezone).
 */
export function isPastCalendarDate(
  value: string | Date | null | undefined,
  reference = new Date(),
): boolean {
  if (!value) return false;
  const parsed = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(parsed.getTime())) return false;
  return startOfLocalCalendarDay(parsed) < startOfLocalCalendarDay(reference);
}
