import { reportService } from '../reports/services/report.service.js';
import { executiveMetricsService } from '../analytics/services/executiveMetrics.service.js';
import { resolveAnalyticsWindow } from '../analytics/validators/analytics.validator.js';
import { REPORT_JOB } from '../config/reports.js';
import { ANALYTICS_DEFAULT_RANGE } from '../config/analytics.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * ReportGenerationJob — precomputes executive metrics and warms the weekly /
 * monthly / summary report caches so expensive report/export requests are
 * instant. Fully INDEPENDENT and NON-BLOCKING: never in a request path, catches
 * its own errors, `unref()`s its timer.
 */
let timer: ReturnType<typeof setInterval> | null = null;

async function runOnce(): Promise<void> {
  try {
    const userId = env.demoUserId;
    await executiveMetricsService.compute(userId, resolveAnalyticsWindow({ range: ANALYTICS_DEFAULT_RANGE }));
    await Promise.all([reportService.weekly(userId), reportService.monthly(userId), reportService.summary(userId)]);
    logger.info('Report generation job: executive metrics + report caches warmed');
  } catch (err) {
    logger.warn('Report generation job run failed', err);
  }
}

export function startReportJob(): void {
  if (!REPORT_JOB.enabled) {
    logger.info('Report generation job disabled (REPORT_JOB_ENABLED=false)');
    return;
  }
  if (timer) return;
  void runOnce();
  timer = setInterval(() => void runOnce(), REPORT_JOB.intervalMs);
  timer.unref?.();
  logger.info(`Report generation job started (every ${Math.round(REPORT_JOB.intervalMs / 60000)} min)`);
}

export function stopReportJob(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
