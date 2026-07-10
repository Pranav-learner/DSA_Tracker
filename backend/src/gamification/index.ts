import { activityService } from '../services/activity.service.js';
import { rewardEngine } from './services/rewardEngine.service.js';
import { logger } from '../utils/logger.js';

export { gamificationRouter } from './routes/gamification.routes.js';

let initialised = false;

/**
 * Wire the Gamification module into the Activity bus. This is the ONE line that
 * makes the whole engine event-driven: the Reward Engine subscribes to every
 * recorded activity, and the core Activity system stays completely unaware of
 * gamification (the feature registers itself; the core imports nothing).
 *
 * Idempotent — safe to call from both the server bootstrap and the test/seed
 * harness without double-subscribing.
 */
export function initGamification(): void {
  if (initialised) return;
  initialised = true;
  activityService.subscribe(async (event) => {
    await rewardEngine.processActivityEvent(event);
  });
  logger.info('Gamification engine subscribed to the activity bus');
}
