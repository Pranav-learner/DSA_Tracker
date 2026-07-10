import type {
  RewardableActivityType,
  RewardType,
  RewardSourceModule,
  LevelFormulaName,
} from '../types/domain.js';

/**
 * Central, configurable tuning for the Gamification / Progression Engine.
 *
 * NOTHING in the engine hardcodes an XP value or a level threshold — it all
 * lives here so the whole progression curve can be retuned in one place, and so
 * Sprint 2 (achievements, badges, challenges) can extend the reward surface
 * without touching engine code.
 */

/** A single XP rule: how much a rewardable activity is worth, and its framing. */
export interface RewardRule {
  /** Base XP granted for this activity. */
  xp: number;
  /** Reward mechanism minted. Sprint 1 is always 'xp'. */
  rewardType: RewardType;
  /** Coarse originating module — powers grouping/filtering in reward history. */
  module: RewardSourceModule;
  /** Human-readable justification stored on the RewardHistory row. */
  reason: string;
}

/**
 * Default XP table (the "RewardRuleService" data). Keyed by the Activity type
 * that triggers the reward, so the engine is a pure lookup: activity → rule.
 * Override at runtime by mutating `REWARD_RULES` (e.g. from a settings service).
 */
export const REWARD_RULES: Record<RewardableActivityType, RewardRule> = {
  'problem-solved': { xp: 20, rewardType: 'xp', module: 'learning', reason: 'Solved a problem' },
  'topic-completed': { xp: 100, rewardType: 'xp', module: 'learning', reason: 'Completed a topic' },
  'phase-completed': { xp: 500, rewardType: 'xp', module: 'learning', reason: 'Completed a phase' },
  'revision-completed': { xp: 15, rewardType: 'xp', module: 'revision', reason: 'Completed a revision' },
  'notebook-created': { xp: 30, rewardType: 'xp', module: 'knowledge', reason: 'Created a knowledge entry' },
  'contest-finished': { xp: 75, rewardType: 'xp', module: 'contest', reason: 'Completed a contest' },
  'upsolve-completed': { xp: 40, rewardType: 'xp', module: 'contest', reason: 'Completed an upsolve' },
  'notebook-updated': { xp: 10, rewardType: 'xp', module: 'knowledge', reason: 'Updated the notebook' },
};

/* ------------------------------------------------------------------ *
 *  Level progression
 * ------------------------------------------------------------------ */

/**
 * Level configuration. The engine computes a level from cumulative XP via a
 * named formula (see `LEVEL_FORMULAS` registry in level.service). Thresholds are
 * never stored — they are always derived — so the whole curve can be retuned
 * here and every user's level recomputes consistently.
 */
export interface LevelConfig {
  /** Which registered curve to use. */
  formula: LevelFormulaName;
  /** XP cost of the very first level-up (Lv.1 → Lv.2). */
  baseXP: number;
  /** Curve steepness. For 'exponential', cost(L) = baseXP * L^exponent. */
  exponent: number;
  /** Safety ceiling for level search / the published ladder length. */
  maxLevel: number;
}

export const LEVEL_CONFIG: LevelConfig = {
  formula: 'exponential',
  baseXP: 100,
  exponent: 1.5,
  maxLevel: 100,
};

/**
 * Named rank tiers, applied by level band. Purely cosmetic (premium feel) and a
 * ready extension point — Sprint 2 badges can key off the same bands.
 */
export interface LevelTier {
  /** Inclusive lower level bound at which this tier begins. */
  minLevel: number;
  name: string;
}

export const LEVEL_TIERS: LevelTier[] = [
  { minLevel: 1, name: 'Novice' },
  { minLevel: 5, name: 'Apprentice' },
  { minLevel: 10, name: 'Practitioner' },
  { minLevel: 20, name: 'Specialist' },
  { minLevel: 35, name: 'Expert' },
  { minLevel: 50, name: 'Master' },
  { minLevel: 75, name: 'Grandmaster' },
];

/* ------------------------------------------------------------------ *
 *  Streaks
 * ------------------------------------------------------------------ */

export interface StreakConfig {
  /**
   * Grace window in days. A gap of `1` day (i.e. acting the very next day)
   * continues the streak; a larger gap breaks it. Kept configurable so a future
   * "streak freeze" feature can widen the window without engine changes.
   */
  graceDays: number;
  /** How many recent days the /streaks endpoint reports a daily breakdown for. */
  dailyBreakdownDays: number;
}

export const STREAK_CONFIG: StreakConfig = {
  graceDays: 1,
  dailyBreakdownDays: 14,
};
