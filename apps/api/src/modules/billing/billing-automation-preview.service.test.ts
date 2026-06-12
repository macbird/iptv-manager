import { describe, expect, it } from 'vitest';
import { computeNextScheduledRunAt } from './billing-automation-preview.service';

/**
 * Unit tests for billing automation preview scheduling helpers.
 *
 * @author João Paulo da Silva
 * @since 4.9.0
 */
describe('computeNextScheduledRunAt', () => {
  it('testComputeNextScheduledRunAt_whenBeforeRunHour_shouldReturnSameDay', () => {
    const from = new Date('2026-06-12T10:00:00.000Z');
    const next = computeNextScheduledRunAt(9, 'America/Sao_Paulo', from);
    const hour = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo',
        hour: 'numeric',
        hour12: false,
      }).format(next),
    );

    expect(hour).toBe(9);
    expect(next.getTime()).toBeGreaterThan(from.getTime());
  });

  it('testComputeNextScheduledRunAt_whenAfterRunHour_shouldReturnFutureHour', () => {
    const from = new Date('2026-06-12T14:00:00.000Z');
    const next = computeNextScheduledRunAt(9, 'America/Sao_Paulo', from);

    expect(next.getTime()).toBeGreaterThan(from.getTime());
  });
});
