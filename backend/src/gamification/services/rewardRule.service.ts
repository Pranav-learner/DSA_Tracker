import { REWARD_RULES, type RewardRule } from '../../config/gamification.js';
import {
  REWARDABLE_ACTIVITY_TYPES,
  type ActivityType,
  type RewardableActivityType,
} from '../../types/domain.js';

const REWARDABLE = new Set<string>(REWARDABLE_ACTIVITY_TYPES);

/**
 * RewardRuleService — the configurable rule table (XP values live in
 * `config/gamification.ts`, never hardcoded in the engine). The engine treats
 * this as a pure lookup: an activity type either maps to a rule or it doesn't
 * (and non-rewardable types — including the engine's own gamification events —
 * simply return `null`, which is what stops the event bus from looping).
 *
 * Rules are mutable at runtime (`setRule`) so a future settings service can
 * retune the economy without a deploy — a Sprint 2 extension point.
 */
export const rewardRuleService = {
  /** Whether this activity type earns a reward at all. */
  isRewardable(type: ActivityType): type is RewardableActivityType {
    return REWARDABLE.has(type);
  },

  /** The rule for a rewardable activity, or `null` if it earns nothing. */
  getRule(type: ActivityType): RewardRule | null {
    return this.isRewardable(type) ? REWARD_RULES[type] : null;
  },

  /** The full rule table (for the config/echo endpoints and Sprint 2 tooling). */
  allRules(): Record<RewardableActivityType, RewardRule> {
    return REWARD_RULES;
  },

  /** Override a rule at runtime (settings/experimentation seam). */
  setRule(type: RewardableActivityType, rule: RewardRule): void {
    REWARD_RULES[type] = rule;
  },
};
