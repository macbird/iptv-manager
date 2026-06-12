import { describe, expect, it } from 'vitest';
import {
  calendarDaysSinceDue,
  getDueDateBoundsForOverdueWindow,
  isOverdueWindowEligible,
  normalizeOverdueReminderDays,
} from './overdue-reminder.util';

describe('normalizeOverdueReminderDays', () => {
  it('testNormalizeOverdueReminderDays_whenDuplicatesAndUnsorted_shouldReturnSortedUnique', () => {
    expect(normalizeOverdueReminderDays([15, 1, 7, 1, 0, -2])).toEqual([1, 7, 15]);
  });

  it('testNormalizeOverdueReminderDays_whenManyValues_shouldKeepAllUniqueSorted', () => {
    expect(normalizeOverdueReminderDays([1, 2, 3, 4, 5, 6, 7])).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('calendarDaysSinceDue', () => {
  it('testCalendarDaysSinceDue_whenDueYesterday_shouldReturnOne', () => {
    const dueDate = new Date('2026-06-10T15:00:00.000Z');
    const today = new Date('2026-06-11T10:00:00.000Z');
    expect(calendarDaysSinceDue(dueDate, today, 'America/Sao_Paulo')).toBe(1);
  });

  it('testCalendarDaysSinceDue_whenDueToday_shouldReturnZero', () => {
    const dueDate = new Date('2026-06-10T15:00:00.000Z');
    const today = new Date('2026-06-10T20:00:00.000Z');
    expect(calendarDaysSinceDue(dueDate, today, 'America/Sao_Paulo')).toBe(0);
  });
});

describe('isOverdueWindowEligible', () => {
  const dueDate = new Date('2026-06-10T12:00:00.000Z');

  it('testIsOverdueWindowEligible_whenOnIdealDay_shouldReturnTrue', () => {
    expect(
      isOverdueWindowEligible({
        dueDate,
        windowDaysAfterDue: 1,
        failureGraceDays: 1,
        referenceDate: new Date('2026-06-11T12:00:00.000Z'),
      }),
    ).toBe(true);
  });

  it('testIsOverdueWindowEligible_whenWithinGrace_shouldReturnTrue', () => {
    expect(
      isOverdueWindowEligible({
        dueDate,
        windowDaysAfterDue: 1,
        failureGraceDays: 1,
        referenceDate: new Date('2026-06-12T12:00:00.000Z'),
      }),
    ).toBe(true);
  });

  it('testIsOverdueWindowEligible_whenAfterGrace_shouldReturnFalse', () => {
    expect(
      isOverdueWindowEligible({
        dueDate,
        windowDaysAfterDue: 1,
        failureGraceDays: 1,
        referenceDate: new Date('2026-06-13T12:00:00.000Z'),
      }),
    ).toBe(false);
  });

  it('testIsOverdueWindowEligible_whenBeforeWindow_shouldReturnFalse', () => {
    expect(
      isOverdueWindowEligible({
        dueDate,
        windowDaysAfterDue: 7,
        failureGraceDays: 1,
        referenceDate: new Date('2026-06-11T12:00:00.000Z'),
      }),
    ).toBe(false);
  });
});

describe('getDueDateBoundsForOverdueWindow', () => {
  it('testGetDueDateBoundsForOverdueWindow_whenD7Grace1_shouldReturnSevenToEightDaysAgo', () => {
    const referenceDate = new Date('2026-06-12T12:00:00.000Z');
    const bounds = getDueDateBoundsForOverdueWindow({
      referenceDate,
      windowDaysAfterDue: 7,
      failureGraceDays: 1,
      timeZone: 'America/Sao_Paulo',
    });

    const dueOnIdealDay = new Date('2026-06-05T12:00:00.000Z');
    const dueOnGraceDay = new Date('2026-06-04T12:00:00.000Z');
    const dueTooEarly = new Date('2026-06-03T12:00:00.000Z');
    const dueTooLate = new Date('2026-06-06T12:00:00.000Z');

    expect(bounds.gte.getTime()).toBeLessThanOrEqual(dueOnGraceDay.getTime());
    expect(bounds.lte.getTime()).toBeGreaterThanOrEqual(dueOnIdealDay.getTime());
    expect(bounds.gte.getTime()).toBeLessThanOrEqual(dueOnIdealDay.getTime());
    expect(bounds.lte.getTime()).toBeGreaterThanOrEqual(dueOnGraceDay.getTime());
    expect(bounds.gte.getTime()).toBeLessThanOrEqual(dueTooEarly.getTime() + 86400000);
    expect(bounds.lte.getTime()).toBeLessThan(dueTooLate.getTime() + 86400000);
  });
});
