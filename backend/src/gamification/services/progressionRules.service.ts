import { ruleContextService } from './ruleContext.service.js';
import { achievementService } from './achievement.service.js';
import { badgeService } from './badge.service.js';
import { challengeService } from './challenge.service.js';
import { celebrationService } from './celebration.service.js';
import { levelService } from './level.service.js';
import { userProgressionRepository } from '../repositories/userProgression.repository.js';
import { logger } from '../../utils/logger.js';
import { GAMIFICATION_ACTIVITY_TYPES } from '../../types/domain.js';
import type { ActivityEvent } from '../../services/activity.service.js';

const GAMIFICATION = new Set<string>(GAMIFICATION_ACTIVITY_TYPES);
/** Streak lengths worth a milestone celebration. */
const STREAK_MILESTONES = [7, 14, 30, 50, 100, 365];
/** Max evaluation passes per event (bonus XP can cascade into XP-threshold rules). */
const MAX_PASSES = 3;

/**
 * ProgressionRulesEngine — the Sprint 2 orchestrator. It subscribes to the
 * Activity bus AFTER the Reward Engine (registration order + sequential dispatch
 * guarantee XP is already applied when this runs), then, for a normal activity
 * event, advances challenges and evaluates achievements + badges. For the
 * engines' own gamification events it only raises celebrations (level-up, streak
 * milestones) — never re-evaluates — which is what bounds the event bus.
 *
 * No module unlocks anything directly: everything is derived here from the same
 * Activity + RewardHistory streams the Reward Engine already maintains.
 */
export const progressionRulesEngine = {
  async processActivityEvent(event: ActivityEvent): Promise<void> {
    try {
      if (GAMIFICATION.has(event.type)) {
        await this.handleGamificationEvent(event);
        return;
      }
      await this.evaluate(event);
    } catch (err) {
      logger.error('ProgressionRulesEngine failed to process activity event', err);
    }
  },

  /** Advance challenges, then evaluate achievements + badges to a fixpoint. */
  async evaluate(event: ActivityEvent): Promise<void> {
    // Challenge progress first — a completion mints bonus XP, which the
    // achievement passes below then see reflected in the fresh context.
    await challengeService.advance(event.userId, event, event.occurredAt);

    for (let pass = 0; pass < MAX_PASSES; pass += 1) {
      const ctx = await ruleContextService.build(event);
      const unlocked = await achievementService.evaluate(event.userId, ctx, event.occurredAt);
      const badges = await badgeService.evaluate(event.userId, ctx, event.occurredAt);
      // Re-evaluate only while unlocks keep happening (bonus XP may cross a
      // new XP/level threshold). Converges within a couple of passes.
      if (unlocked.length === 0 && badges.length === 0) break;
    }
  },

  /** Turn the engines' own events into celebrations (no re-evaluation). */
  async handleGamificationEvent(event: ActivityEvent): Promise<void> {
    if (event.type === 'level-up') {
      const prog = await userProgressionRepository.getOrCreate(event.userId);
      const tier = levelService.tierFor(prog.currentLevel);
      await celebrationService.celebrate(event.userId, {
        type: 'level-up',
        title: `Level ${prog.currentLevel}`,
        description: `You reached Level ${prog.currentLevel} — ${tier}.`,
        icon: '⭐',
        metadata: { level: prog.currentLevel, tier },
        occurredAt: event.occurredAt,
      });
    } else if (event.type === 'streak-increased') {
      const prog = await userProgressionRepository.getOrCreate(event.userId);
      if (STREAK_MILESTONES.includes(prog.currentStreak)) {
        await celebrationService.celebrate(event.userId, {
          type: 'milestone-reached',
          title: `${prog.currentStreak}-day streak!`,
          description: `You've learned ${prog.currentStreak} days in a row.`,
          icon: '🔥',
          metadata: { streak: prog.currentStreak },
          occurredAt: event.occurredAt,
        });
      }
    }
    // All other gamification events (xp-awarded, achievement/badge/challenge
    // mirrors, streak-broken, progression-updated) are intentionally ignored.
  },
};
