import type {
  ActivityType,
  ActivityEntityType,
  AchievementRarity,
  GamificationCategory,
} from '../types/domain.js';

/**
 * Configurable achievement, badge & challenge rules for the ProgressionRulesEngine
 * (Module 6 · Sprint 2). As in Sprint 1's REWARD_RULES, nothing is hardcoded in
 * the engine — every unlock is *data* defined here. Adding an achievement/badge/
 * challenge is a config edit, never an engine change.
 */

/**
 * The read-only snapshot a rule evaluates against. Built once per activity event
 * by the ruleContext service and shared across all rule evaluations, so a single
 * event triggers at most one aggregation pass (see Performance in the docs).
 */
export interface RuleContext {
  event: {
    type: ActivityType;
    entityType: ActivityEntityType;
    entityId: string | null;
    title: string;
  };
  /** Current progression snapshot (post-XP-award for this event). */
  progression: {
    totalXP: number;
    currentLevel: number;
    currentStreak: number;
    longestStreak: number;
    totalDaysActive: number;
  };
  /** Lifetime counts keyed by the earning activity type (from RewardHistory). */
  counts: Record<string, number>;
  /** Distinct earned titles per activity type — powers keyword/category rules. */
  titles: Record<string, string[]>;
}

/** Count helper — how many of an activity type the user has earned. */
export function count(ctx: RuleContext, source: ActivityType): number {
  return ctx.counts[source] ?? 0;
}

/** Keyword helper — earned titles of a source matching any keyword (case-insensitive). */
export function titlesMatching(ctx: RuleContext, source: ActivityType, keywords: string[]): number {
  const list = ctx.titles[source] ?? [];
  const re = new RegExp(keywords.join('|'), 'i');
  return list.filter((t) => re.test(t)).length;
}

/** A single achievement definition. `progress` returns 0..maxProgress. */
export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  category: GamificationCategory;
  rarity: AchievementRarity;
  /** Emoji icon (frontend maps to a styled token). */
  icon: string;
  maxProgress: number;
  /** Bonus XP granted on unlock (minted via the Reward Engine — never inline). */
  bonusXP?: number;
  /** Badge to also unlock when this achievement unlocks. */
  badgeKey?: string;
  progress: (ctx: RuleContext) => number;
}

/**
 * The achievement catalogue. `titles`/`counts` come from the same RewardHistory
 * ledger the Reward Engine already dedupes, so counts are exactly-once accurate.
 */
export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    key: 'first-accepted',
    title: 'First Accepted',
    description: 'Solve your very first problem.',
    category: 'Problems',
    rarity: 'Common',
    icon: '✅',
    maxProgress: 1,
    bonusXP: 25,
    progress: (c) => count(c, 'problem-solved'),
  },
  {
    key: 'ten-problems',
    title: 'Getting Warmed Up',
    description: 'Solve 10 problems.',
    category: 'Problems',
    rarity: 'Common',
    icon: '🔟',
    maxProgress: 10,
    bonusXP: 50,
    progress: (c) => count(c, 'problem-solved'),
  },
  {
    key: 'hundred-problems',
    title: 'Century',
    description: 'Solve 100 problems.',
    category: 'Problems',
    rarity: 'Epic',
    icon: '💯',
    maxProgress: 100,
    bonusXP: 500,
    badgeKey: 'speed-solver',
    progress: (c) => count(c, 'problem-solved'),
  },
  {
    key: 'first-contest',
    title: 'Into the Arena',
    description: 'Finish your first contest.',
    category: 'Contests',
    rarity: 'Rare',
    icon: '⚔️',
    maxProgress: 1,
    bonusXP: 75,
    progress: (c) => count(c, 'contest-finished'),
  },
  {
    key: 'contest-veteran',
    title: 'Contest Veteran',
    description: 'Finish 5 contests.',
    category: 'Contests',
    rarity: 'Epic',
    icon: '🏆',
    maxProgress: 5,
    bonusXP: 250,
    badgeKey: 'contest-veteran',
    progress: (c) => count(c, 'contest-finished'),
  },
  {
    key: 'first-revision',
    title: 'Never Forget',
    description: 'Complete your first revision.',
    category: 'Revision',
    rarity: 'Common',
    icon: '🔁',
    maxProgress: 1,
    bonusXP: 20,
    progress: (c) => count(c, 'revision-completed'),
  },
  {
    key: 'knowledge-builder',
    title: 'Knowledge Builder',
    description: 'Create 5 knowledge entries.',
    category: 'Knowledge',
    rarity: 'Rare',
    icon: '📚',
    maxProgress: 5,
    bonusXP: 100,
    badgeKey: 'knowledge-builder',
    progress: (c) => count(c, 'notebook-created'),
  },
  {
    key: 'pattern-hunter',
    title: 'Pattern Hunter',
    description: 'Document 10 patterns in your notebook.',
    category: 'Knowledge',
    rarity: 'Epic',
    icon: '🧠',
    maxProgress: 10,
    bonusXP: 200,
    badgeKey: 'pattern-hunter',
    progress: (c) => count(c, 'notebook-created'),
  },
  {
    key: 'graph-explorer',
    title: 'Graph Explorer',
    description: 'Solve 5 graph problems.',
    category: 'Mastery',
    rarity: 'Rare',
    icon: '🕸️',
    maxProgress: 5,
    bonusXP: 120,
    progress: (c) => titlesMatching(c, 'problem-solved', ['graph', 'island', 'bfs', 'dfs', 'course', 'clone', 'ladder', 'rotting']),
  },
  {
    key: 'dp-master',
    title: 'DP Master',
    description: 'Solve 5 dynamic-programming problems.',
    category: 'Mastery',
    rarity: 'Legendary',
    icon: '📈',
    maxProgress: 5,
    bonusXP: 300,
    progress: (c) => titlesMatching(c, 'problem-solved', ['\\bdp\\b', 'dynamic', 'knapsack', 'subsequence', 'subarray', 'coin', 'climbing']),
  },
  {
    key: 'phase-conqueror',
    title: 'Phase Conqueror',
    description: 'Complete a full roadmap phase.',
    category: 'Progression',
    rarity: 'Epic',
    icon: '🚀',
    maxProgress: 1,
    bonusXP: 300,
    badgeKey: 'phase-conqueror',
    progress: (c) => count(c, 'phase-completed'),
  },
  {
    key: 'streak-30',
    title: '30-Day Streak',
    description: 'Learn every day for 30 days.',
    category: 'Streak',
    rarity: 'Legendary',
    icon: '🔥',
    maxProgress: 30,
    bonusXP: 500,
    badgeKey: 'streak-master',
    progress: (c) => c.progression.longestStreak,
  },
  {
    key: 'xp-1000',
    title: 'Grinder',
    description: 'Earn 1,000 total XP.',
    category: 'Progression',
    rarity: 'Rare',
    icon: '⚡',
    maxProgress: 1000,
    progress: (c) => c.progression.totalXP,
  },
  {
    key: 'level-10',
    title: 'Double Digits',
    description: 'Reach level 10.',
    category: 'Progression',
    rarity: 'Epic',
    icon: '🎯',
    maxProgress: 10,
    bonusXP: 250,
    progress: (c) => c.progression.currentLevel,
  },
];
