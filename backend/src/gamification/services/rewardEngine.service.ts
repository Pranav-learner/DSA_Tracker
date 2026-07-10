import { rewardRuleService } from './rewardRule.service.js';
import { levelService, type LevelState } from './level.service.js';
import { streakService, type StreakAdvance } from './streak.service.js';
import { gamificationActivity } from './gamificationActivity.js';
import { userProgressionRepository } from '../repositories/userProgression.repository.js';
import { rewardHistoryRepository } from '../repositories/rewardHistory.repository.js';
import { progressionCache } from './progressionCache.js';
import { logger } from '../../utils/logger.js';
import type { ActivityEvent } from '../../services/activity.service.js';
import type { ActivityType } from '../../types/domain.js';

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

/** Result of committing XP (shared by rule awards and bonus awards). */
export interface CommitResult {
  level: LevelState;
  prevLevel: number;
  leveledUp: boolean;
  streak: StreakAdvance;
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
 * RewardEngine — the ONLY place XP is ever minted. It subscribes to the Activity
 * bus (rule-based awards) and also exposes `awardBonus` so the Sprint 2
 * ProgressionRulesEngine can grant achievement/challenge XP through the SAME
 * code path — reward logic is never duplicated.
 *
 * Idempotency & ordering (exactly-once without a DB transaction):
 *   1. RewardHistory is written FIRST as an idempotency lock — its unique
 *      {userId, activityId} index makes a duplicate insert impossible. Bonus
 *      awards use a synthetic activityId (e.g. `achievement:<key>`) so each
 *      bonus is granted at most once.
 *   2. XP is then applied via an atomic `$inc`.
 *   3. Level + streak are derived from the post-award total and persisted.
 * A crash between (1) and (2) under-counts (recoverable by replay), never
 * double-counts — the safe failure direction. Upgrades to a real transaction
 * once a replica set is available.
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
    // 1. Validate + resolve rule. Non-rewardable types (including gamification
    //    events) short-circuit here — the loop-breaker.
    const rule = rewardRuleService.getRule(event.type);
    if (!rule) return NO_REWARD('not-rewardable');

    const { userId } = event;

    // 2. Duplicate lock: write the reward row FIRST.
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

    // 3–6. Commit XP → level → streak, then emit events.
    const commit = await this.commit(userId, rule.xp, event.occurredAt);
    await this.emit(userId, rule.xp, event.title, commit);

    return {
      awarded: true,
      xp: rule.xp,
      leveledUp: commit.leveledUp,
      newLevel: commit.level.level,
      streakTransition: commit.streak.transition,
    };
  },

  /**
   * Grant bonus XP for a non-activity source (achievement / challenge / badge).
   * Deduped by `sourceKey` so a bonus is minted at most once. Returns the commit
   * result (or null if the bonus was already granted / amount is 0).
   */
  async awardBonus(
    userId: string,
    opts: {
      amount: number;
      /** Gamification activity type recorded as the reward source. */
      source: ActivityType;
      /** Stable dedup key, e.g. `achievement:first-accepted` or `challenge:<id>`. */
      sourceKey: string;
      reason: string;
      title: string;
      metadata?: Record<string, unknown>;
      occurredAt?: Date;
    },
  ): Promise<CommitResult | null> {
    if (opts.amount <= 0) return null;
    const occurredAt = opts.occurredAt ?? new Date();

    const reward = await rewardHistoryRepository.create({
      userId,
      activityId: opts.sourceKey,
      rewardType: 'xp',
      rewardSource: opts.source,
      xpAwarded: opts.amount,
      reason: opts.reason,
      metadata: { bonus: true, ...opts.metadata },
      createdAt: occurredAt,
    });
    if (!reward) return null; // already granted

    const commit = await this.commit(userId, opts.amount, occurredAt);
    await this.emit(userId, opts.amount, opts.title, commit);
    return commit;
  },

  /** Apply XP atomically, then derive + persist level & streak. */
  async commit(userId: string, xp: number, occurredAt: Date): Promise<CommitResult> {
    const bumped = await userProgressionRepository.incrementXP(userId, xp);
    const prevLevel = levelService.levelForXP(bumped.totalXP - xp);
    const level = levelService.compute(bumped.totalXP);
    const leveledUp = level.level > prevLevel;

    const streak = streakService.advance(
      {
        currentStreak: bumped.currentStreak,
        longestStreak: bumped.longestStreak,
        totalDaysActive: bumped.totalDaysActive,
        lastActivityDate: bumped.lastActivityDate,
      },
      occurredAt,
    );

    await userProgressionRepository.applyDerived(userId, {
      currentLevel: level.level,
      currentXP: level.currentXP,
      currentLevelXP: level.currentLevelXP,
      nextLevelXP: level.nextLevelXP,
      ...streak.fields,
    });

    progressionCache.invalidate(userId);
    return { level, prevLevel, leveledUp, streak };
  },

  /** Emit gamification activity events (best-effort, non-rewardable → no loop). */
  async emit(userId: string, xp: number, sourceTitle: string, commit: CommitResult): Promise<void> {
    await gamificationActivity.xpAwarded(userId, { xp, sourceTitle, level: commit.level.level });
    if (commit.leveledUp) await gamificationActivity.levelUp(userId, commit.level);
    if (commit.streak.isNewDay) await gamificationActivity.streakChanged(userId, commit.streak);
  },
};
