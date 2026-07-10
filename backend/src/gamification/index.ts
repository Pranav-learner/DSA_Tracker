import { activityService } from '../services/activity.service.js';
import { rewardEngine } from './services/rewardEngine.service.js';
import { progressionRulesEngine } from './services/progressionRules.service.js';
import { logger } from '../utils/logger.js';

export { gamificationRouter } from './routes/gamification.routes.js';

let initialised = false;

/**
 * Wire the Gamification module into the Activity bus. This is what makes the
 * whole engine event-driven: two subscribers, in a deliberate order.
 *
 *   1. Reward Engine        — mints XP / level / streak from the event.
 *   2. ProgressionRulesEngine — evaluates achievements, badges, challenges and
 *                               celebrations, reading the progression the Reward
 *                               Engine just updated.
 *
 * The bus dispatches subscribers sequentially (awaited in registration order),
 * so (1) always completes before (2) runs — an XP-threshold achievement sees the
 * XP from the same event. The core Activity system stays unaware of gamification
 * (the feature registers itself; the core imports nothing).
 *
 * Idempotent — safe to call from the server bootstrap, tests and the seed.
 */
export function initGamification(): void {
  if (initialised) return;
  initialised = true;
  activityService.subscribe(async (event) => {
    await rewardEngine.processActivityEvent(event);
  });
  activityService.subscribe(async (event) => {
    await progressionRulesEngine.processActivityEvent(event);
  });
  logger.info('Gamification engine (reward + rules) subscribed to the activity bus');
}
