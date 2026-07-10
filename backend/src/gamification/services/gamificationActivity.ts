import { activityService } from '../../services/activity.service.js';
import type { LevelState } from './level.service.js';
import type { StreakAdvance } from './streak.service.js';

/**
 * GamificationActivity — the seam that emits the Reward Engine's own events back
 * into the Activity feed ('xp-awarded', 'level-up', 'streak-increased',
 * 'streak-broken'). These reuse the exact same Activity system every other
 * module writes to, so they surface on the dashboard timeline for free.
 *
 * Safe by construction: these event types are NOT rewardable, so when the bus
 * dispatches them back to the engine it returns immediately — no XP, no loop.
 */
export const gamificationActivity = {
  async xpAwarded(
    userId: string,
    { xp, sourceTitle, level }: { xp: number; sourceTitle: string; level: number },
  ): Promise<void> {
    await activityService.record(userId, {
      type: 'xp-awarded',
      entityType: 'progression',
      entityId: null,
      title: `+${xp} XP`,
      description: `${sourceTitle} · Level ${level}`,
    });
  },

  async levelUp(userId: string, level: LevelState): Promise<void> {
    await activityService.record(userId, {
      type: 'level-up',
      entityType: 'progression',
      entityId: null,
      title: `Reached Level ${level.level}`,
      description: `You're now a ${level.tier}. ${level.isMaxLevel ? 'Max level!' : `${level.xpRemaining} XP to the next level.`}`,
    });
  },

  async streakChanged(userId: string, streak: StreakAdvance): Promise<void> {
    const current = streak.fields.currentStreak;
    if (streak.transition === 'increased' || streak.transition === 'started') {
      await activityService.record(userId, {
        type: 'streak-increased',
        entityType: 'progression',
        entityId: null,
        title: `${current}-day streak`,
        description: current === 1 ? 'A new learning streak begins.' : `${current} days of learning in a row. Keep it up!`,
      });
    } else if (streak.transition === 'broken') {
      await activityService.record(userId, {
        type: 'streak-broken',
        entityType: 'progression',
        entityId: null,
        title: 'Streak reset',
        description: 'Your streak lapsed — a fresh one starts today.',
      });
    }
  },
};
