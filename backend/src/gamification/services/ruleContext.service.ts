import { userProgressionRepository } from '../repositories/userProgression.repository.js';
import { rewardHistoryRepository } from '../repositories/rewardHistory.repository.js';
import type { RuleContext } from '../../config/achievements.js';
import type { ActivityEvent } from '../../services/activity.service.js';

/** Activity types whose earned titles we load for keyword/category rules. */
const TITLE_SOURCES = ['problem-solved', 'topic-completed', 'notebook-created'];

/**
 * RuleContextService — builds the read-only snapshot every rule evaluates
 * against. It runs a single progression read plus two small aggregations over
 * RewardHistory (counts + titles), so one activity event triggers one context
 * build shared across ALL achievement/badge evaluations — not N queries per rule.
 */
export const ruleContextService = {
  async build(event: ActivityEvent): Promise<RuleContext> {
    const [progression, counts, titles] = await Promise.all([
      userProgressionRepository.getOrCreate(event.userId),
      rewardHistoryRepository.countsBySource(event.userId),
      rewardHistoryRepository.titlesBySource(event.userId, TITLE_SOURCES),
    ]);

    return {
      event: {
        type: event.type,
        entityType: event.entityType,
        entityId: event.entityId,
        title: event.title,
      },
      progression: {
        totalXP: progression.totalXP,
        currentLevel: progression.currentLevel,
        currentStreak: progression.currentStreak,
        longestStreak: progression.longestStreak,
        totalDaysActive: progression.totalDaysActive,
      },
      counts,
      titles,
    };
  },
};
