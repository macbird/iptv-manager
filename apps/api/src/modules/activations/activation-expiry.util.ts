import type { BillingCycle } from '@prisma/client';

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Chooses the base date to extend subscription expiry from when an activation is completed.
 * If the current expiry is still in the future, extend from that date; otherwise extend from
 * the activation date (today).
 */
export function resolveRenewalBaseDate(
  currentExpiresAt: Date | null | undefined,
  activationCompletedAt: Date,
): Date {
  const activationDay = startOfDay(activationCompletedAt);

  if (!currentExpiresAt) {
    return activationDay;
  }

  const expiryDay = startOfDay(currentExpiresAt);
  if (expiryDay > activationDay) {
    return expiryDay;
  }

  return activationDay;
}

/**
 * Computes the next subscription expiry date from a base date and plan billing cycle.
 */
export function extendExpiryFromDate(baseDate: Date, billingCycle: BillingCycle): Date {
  const result = new Date(baseDate);
  switch (billingCycle) {
    case 'monthly':
      result.setMonth(result.getMonth() + 1);
      break;
    case 'quarterly':
      result.setMonth(result.getMonth() + 3);
      break;
    case 'yearly':
      result.setFullYear(result.getFullYear() + 1);
      break;
    default:
      result.setMonth(result.getMonth() + 1);
  }
  return result;
}
