import { analyticsAggregationService } from '../analytics/services/analyticsAggregation.service.js';
import { insightActivityService } from '../analytics/services/insightActivity.service.js';
import { resolveAnalyticsWindow } from '../analytics/validators/analytics.validator.js';
import { ANALYTICS_JOB, ANALYTICS_DEFAULT_RANGE } from '../config/analytics.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Analytics refresh job — pre-warms the expensive overview aggregation so the
 * first dashboard hit after idle is already cached. Fully INDEPENDENT and
 * NON-BLOCKING: it never sits in a request path, catches its own errors, and
 * `unref()`s its timer so it can't keep the process alive.
 *
 * Single-user platform → warms the demo user's default window. When multi-user
 * auth lands, iterate active users here. It also serves as the seam for future
 * daily-summary / snapshot generation (Sprint 2+).
 */
let timer: ReturnType<typeof setInterval> | null = null;

async function runOnce(): Promise<void> {
  try {
    const window = resolveAnalyticsWindow({ range: ANALYTICS_DEFAULT_RANGE });
    // Bust any stale entry, then recompute + cache.
    analyticsAggregationService.invalidate(env.demoUserId);
    await analyticsAggregationService.overview(env.demoUserId, window);
    // Module 4 · Sprint 3 — surface notable insights into the activity feed (deduped).
    const { emitted } = await insightActivityService.emit(env.demoUserId, window);
    logger.info(`Analytics refresh job: overview warmed, ${emitted} insight activities emitted`);
  } catch (err) {
    logger.warn('Analytics refresh job run failed', err);
  }
}

export function startAnalyticsJob(): void {
  if (!ANALYTICS_JOB.enabled) {
    logger.info('Analytics refresh job disabled (ANALYTICS_JOB_ENABLED=false)');
    return;
  }
  if (timer) return;
  void runOnce();
  timer = setInterval(() => void runOnce(), ANALYTICS_JOB.intervalMs);
  timer.unref?.();
  logger.info(`Analytics refresh job started (every ${Math.round(ANALYTICS_JOB.intervalMs / 60000)} min)`);
}

export function stopAnalyticsJob(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
