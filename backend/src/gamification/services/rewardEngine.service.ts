import { rewardRuleService } from './rewardRule.service.js';
import { levelService } from './level.service.js';
import { streakService } from './streak.service.js';
import { gamificationActivity } from './gamificationActivity.js';
import { userProgressionRepository } from '../repositories/userProgression.repository.js';
import { rewardHistoryRepository } from '../repositories/rewardHistory.repository.js';
import { progressionCache } from './progressionCache.js';
import { logger } from '../../utils/logger.js';
import type { ActivityEvent } from '../../services/activity.service.js';

/** Outcome of processing one activity event (mostly for tests/seed reporting). */
export interface RewardOutcome {
  awarded: boolean;
  xp: number;
  leveledUp: boolean;
  newLevel: number;
  streakTransition: string | null;
  /** Why nothing was awarded, when `awarded` is false. */
  skipped?: 'not-rewardable' | 'duplicate';
}

const NO_REWARD = (skipped: RewardOutcome['skipped']): RewardOutcome => ({
  awarded: false,
  xp: 0,
  leveledUp: false,
  newLevel: 0,
  streakTransition: null,
  skipped,
});

/**
 * RewardEngine — the ONLY place XP is ever awarded. It subscribes to the
 * Activity bus and turns rewardable events into progression changes, following
 * the canonical flow:
 *
 *   validate event → check duplicate → resolve rule → award XP → update level →
 *   update streak → store reward history → emit gamification activity events.
 *
 * Idempotency & ordering (exactly-once without a DB transaction):
 *   1. RewardHistory is written FIRST as an idempotency lock — its unique
 *      {userId, activityId} index makes a duplicate insert impossible, so a
 *      re-delivered event can never double-award. On a duplicate we stop before
 *      touching XP.
 *   2. XP is then applied via an atomic `$inc` (safe under concurrency).
 *   3. Level + streak are derived from the post-award total and persisted.
 * If the process died between (1) and (2) the effect is an under-count (a logged
 * reward with unapplied XP), never a double-count — the safe failure direction,
 * and fully recoverable by replaying from the logs. A real DB transaction is a
 * drop-in upgrade once the deployment runs a replica set (see docs).
 */
export const rewardEngine = {
  /** Activity-bus entry point. Best-effort; never throws back to the recorder. */
  async processActivityEvent(event: ActivityEvent): Promise<RewardOutcome> {
    try {
      return await this.award(event);
    } catch (err) {
      logger.error('RewardEngine failed to process activity event', err);
      return NO_REWARD('not-rewardable');
    }
  },

  async award(event: ActivityEvent): Promise<RewardOutcome> {
    // 1. Validate + resolve rule. Non-rewardable types (including the engine's
    //    own emitted gamification events) short-circuit here — the loop-breaker.
    const rule = rewardRuleService.getRule(event.type);
    if (!rule) return NO_REWARD('not-rewardable');

    const { userId } = event;

    // 2. Duplicate lock: write the reward row FIRST. A second event for the same
    //    activity loses the unique-index race and returns null → no double XP.
    const reward = await rewardHistoryRepository.create({
      userId,
      activityId: event.id,
      rewardType: rule.rewardType,
      rewardSource: event.type,
      xpAwarded: rule.xp,
      reason: rule.reason,
      metadata: {
        module: rule.module,
        entityType: event.entityType,
        entityId: event.entityId,
        title: event.title,
      },
      createdAt: event.occurredAt,
    });
    if (!reward) return NO_REWARD('duplicate');

    // 3. Award XP atomically; the returned doc has the NEW total but PRE-award
    //    level/streak fields — exactly what we need to detect transitions.
    const bumped = await userProgressionRepository.incrementXP(userId, rule.xp);
    const prevLevel = levelService.levelForXP(bumped.totalXP - rule.xp);

    // 4. Update level from the new lifetime total.
    const level = levelService.compute(bumped.totalXP);
    const leveledUp = level.level > prevLevel;

    // 5. Update streak, dated by when the activity actually occurred.
    const streak = streakService.advance(
      {
        currentStreak: bumped.currentStreak,
        longestStreak: bumped.longestStreak,
        totalDaysActive: bumped.totalDaysActive,
        lastActivityDate: bumped.lastActivityDate,
      },
      event.occurredAt,
    );

    // 6. Persist the derived level + streak fields.
    await userProgressionRepository.applyDerived(userId, {
      currentLevel: level.level,
      currentXP: level.currentXP,
      currentLevelXP: level.currentLevelXP,
      nextLevelXP: level.nextLevelXP,
      ...streak.fields,
    });

    // Progression summary is cached; a change invalidates it.
    progressionCache.invalidate(userId);

    // 7. Emit gamification events back onto the Activity feed (best-effort).
    //    These are non-rewardable, so they no-op when the bus routes them here.
    await gamificationActivity.xpAwarded(userId, {
      xp: rule.xp,
      sourceTitle: event.title,
      level: level.level,
    });
    if (leveledUp) await gamificationActivity.levelUp(userId, level);
    if (streak.isNewDay) await gamificationActivity.streakChanged(userId, streak);

    return {
      awarded: true,
      xp: rule.xp,
      leveledUp,
      newLevel: level.level,
      streakTransition: streak.transition,
    };
  },
};
