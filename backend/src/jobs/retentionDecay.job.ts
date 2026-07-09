import { retentionService } from '../services/retention.service.js';
import { RETENTION_JOB } from '../config/retention.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Background retention job — applies daily confidence decay, flags overdue/at-risk
 * entities and refreshes retention aggregates. Fully INDEPENDENT and NON-BLOCKING:
 * it never sits in a request path, catches its own errors, and `unref()`s its timer
 * so it can't keep the process alive. Cadence + toggle come from config (env).
 *
 * Single-user platform → operates on the demo user. When multi-user auth lands,
 * swap the single call for an iteration over active users.
 */
let timer: ReturnType<typeof setInterval> | null = null;

async function runOnce(): Promise<void> {
  try {
    const result = await retentionService.applyDecayForAll(env.demoUserId);
    logger.info(`Retention decay job: processed ${result.processed}, changed ${result.changed}`);
  } catch (err) {
    logger.warn('Retention decay job run failed', err);
  }
}

export function startRetentionJob(): void {
  if (!RETENTION_JOB.enabled) {
    logger.info('Retention decay job disabled (RETENTION_JOB_ENABLED=false)');
    return;
  }
  if (timer) return;

  // Kick off once shortly after boot, then on the configured cadence.
  void runOnce();
  timer = setInterval(() => void runOnce(), RETENTION_JOB.intervalMs);
  timer.unref?.();
  logger.info(`Retention decay job started (every ${Math.round(RETENTION_JOB.intervalMs / 60000)} min)`);
}

export function stopRetentionJob(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
