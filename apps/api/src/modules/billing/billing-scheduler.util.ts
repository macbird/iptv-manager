/**
 * Shared scheduler interval resolution for billing automation.
 */
export function resolveSchedulerIntervalMinutes(): number {
  const raw = process.env.BILLING_SCHEDULER_INTERVAL_MINUTES?.trim();
  if (raw) {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return 60;
    }
    return Math.floor(parsed);
  }

  return process.env.NODE_ENV === 'development' ? 10 : 60;
}

/**
 * Scheduler metadata exposed to tenant automation settings UI.
 */
export function getBillingAutomationSchedulerMeta() {
  const intervalMinutes = resolveSchedulerIntervalMinutes();
  return {
    intervalMinutes,
    matchByClock: intervalMinutes >= 60,
    isDevelopment: process.env.NODE_ENV === 'development',
  };
}
