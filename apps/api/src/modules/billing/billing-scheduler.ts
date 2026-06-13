import cron from 'node-cron';
import { prisma } from '../../core/database';
import { BillingAutomationService } from './billing-automation.service';
import { PlatformBillingAutomationService } from './platform-billing-automation.service';
import { resolveSchedulerIntervalMinutes } from './billing-scheduler.util';

const billingAutomationService = new BillingAutomationService();
const platformBillingAutomationService = new PlatformBillingAutomationService();

const DEFAULT_TZ = 'America/Sao_Paulo';
const MINUTE_CRON = '* * * * *';

interface BillingSchedulerConfig {
  timezone: string;
  cronExpression: string;
  matchByClock: boolean;
  intervalMinutes?: number;
}

/**
 * Starts the in-process billing automation scheduler (node-cron).
 *
 * @author João Paulo da Silva
 * @since 4.9.0
 * @creationDate 10/06/2026

 */
export function startBillingScheduler(): void {
  if (process.env.BILLING_SCHEDULER_ENABLED === 'false') {
    console.info('[billing-scheduler] disabled via BILLING_SCHEDULER_ENABLED=false');
    return;
  }

  const config = resolveSchedulerConfig();

  cron.schedule(
    config.cronExpression,
    () => {
      void runScheduledTick(config);
    },
    { timezone: config.timezone },
  );

  const intervalLabel =
    config.intervalMinutes !== undefined
      ? `${config.intervalMinutes}min`
      : `cron=${config.cronExpression}`;
  const matchLabel = config.matchByClock ? 'clock-match (hour+minute)' : 'all-active-tenants';

  console.info(
    `[billing-scheduler] started (timezone=${config.timezone}, ${intervalLabel}, ${matchLabel})`,
  );
}

async function runScheduledTick(config: BillingSchedulerConfig): Promise<void> {
  const now = new Date();
  const filterByHour = config.matchByClock ? getZonedHour(now, config.timezone) : undefined;
  const filterByMinute = config.matchByClock ? getZonedMinute(now, config.timezone) : undefined;

  const run = await prisma.billingJobRun.create({
    data: { status: 'running' },
  });

  try {
    const tenantSummary = await billingAutomationService.runForSchedule(
      filterByHour,
      filterByMinute,
    );
    const platformSummary = await platformBillingAutomationService.runForSchedule(
      filterByHour,
      filterByMinute,
    );

    const summary = {
      tenant: tenantSummary,
      platform: platformSummary,
    };

    await prisma.billingJobRun.update({
      where: { id: run.id },
      data: {
        status: 'completed',
        finishedAt: new Date(),
        summary: summary as object,
      },
    });

    const hasActivity =
      tenantSummary.tenantsProcessed > 0 ||
      tenantSummary.invoicesCreated > 0 ||
      tenantSummary.chargesSent > 0 ||
      tenantSummary.tenantReportsSent > 0 ||
      tenantSummary.invoicesAutoClosed > 0 ||
      tenantSummary.overdueRemindersSent > 0 ||
      platformSummary.invoicesCreated > 0 ||
      platformSummary.chargesSent > 0 ||
      tenantSummary.errors.length > 0 ||
      platformSummary.errors.length > 0;

    if (hasActivity) {
      console.info('[billing-scheduler] run summary', summary);
    }
  } catch (error) {
    await prisma.billingJobRun.update({
      where: { id: run.id },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        summary: {
          error: error instanceof Error ? error.message : String(error),
        },
      },
    });
    console.error('[billing-scheduler] run failed', error);
  }
}

function resolveSchedulerConfig(): BillingSchedulerConfig {
  const timezone = process.env.BILLING_SCHEDULER_TZ ?? DEFAULT_TZ;
  const customCron = process.env.BILLING_SCHEDULER_CRON?.trim();

  if (customCron) {
    const matchByClock = resolveMatchByClock(customCron, undefined);
    return { timezone, cronExpression: customCron, matchByClock };
  }

  const intervalMinutes = resolveSchedulerIntervalMinutes();
  const matchByClock = intervalMinutes >= 60;
  const cronExpression = matchByClock ? MINUTE_CRON : `*/${intervalMinutes} * * * *`;

  if (!matchByClock && 60 % intervalMinutes !== 0) {
    console.warn(
      `[billing-scheduler] BILLING_SCHEDULER_INTERVAL_MINUTES=${intervalMinutes} does not divide 60 evenly`,
    );
  }

  return { timezone, cronExpression, matchByClock, intervalMinutes };
}

function resolveMatchByClock(cronExpression: string, intervalMinutes: number | undefined): boolean {
  const explicit = process.env.BILLING_SCHEDULER_MATCH_HOUR?.trim().toLowerCase();
  if (explicit === 'true') {
    return true;
  }
  if (explicit === 'false') {
    return false;
  }

  if (intervalMinutes !== undefined) {
    return intervalMinutes >= 60;
  }

  return cronExpression === MINUTE_CRON;
}

function getZonedHour(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(date);

  return Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
}

function getZonedMinute(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    minute: 'numeric',
  }).formatToParts(date);

  return Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
}
