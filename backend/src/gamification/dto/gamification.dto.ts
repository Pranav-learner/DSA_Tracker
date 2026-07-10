import type {
  RewardType,
  ActivityType,
  RewardSourceModule,
  LevelFormulaName,
  AchievementRarity,
  ChallengeType,
  ChallengeStatus,
  CelebrationType,
} from '../../types/domain.js';

/**
 * API DTOs for the Gamification / Progression Engine. These are the frozen
 * contract the frontend mirrors; every date is an ISO string.
 */

/** GET /api/gamification/progression — the learner's progression summary. */
export interface ProgressionSummaryDTO {
  level: number;
  tier: string;
  /** Lifetime cumulative XP. */
  totalXP: number;
  /** XP earned within the current level (progress numerator). */
  currentXP: number;
  /** Absolute XP threshold where the current level began. */
  currentLevelXP: number;
  /** XP span of the current level (progress denominator). */
  nextLevelXP: number;
  /** XP still needed to reach the next level. */
  xpRemaining: number;
  /** 0–1 progress through the current level. */
  levelProgress: number;
  isMaxLevel: boolean;
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  /** True if the streak is still live as of now (within the grace window). */
  streakActive: boolean;
  lastActivityDate: string | null;
  /** XP earned so far today (UTC). */
  todaysXP: number;
  updatedAt: string | null;
}

/** A single reward-history row. */
export interface RewardDTO {
  id: string;
  activityId: string;
  rewardType: RewardType;
  rewardSource: ActivityType;
  xpAwarded: number;
  reason: string;
  module: RewardSourceModule | null;
  entityType: string | null;
  entityId: string | null;
  title: string | null;
  createdAt: string;
}

/** GET /api/gamification/rewards/history — paginated, filtered history. */
export interface RewardHistoryPageDTO {
  items: RewardDTO[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/** One rung of the published level ladder. */
export interface LevelLadderRowDTO {
  level: number;
  /** XP cost to advance from this level to the next. */
  xpForLevel: number;
  /** Cumulative XP required to reach this level. */
  totalXpToReach: number;
  tier: string;
  /** True for the user's current level. */
  isCurrent: boolean;
}

/** GET /api/gamification/levels — the ladder + where the user sits on it. */
export interface LevelsDTO {
  formula: LevelFormulaName;
  baseXP: number;
  exponent: number;
  maxLevel: number;
  currentLevel: number;
  currentXP: number;
  nextLevelXP: number;
  levelProgress: number;
  ladder: LevelLadderRowDTO[];
}

/** One day in the streak breakdown. */
export interface DailyActivityDTO {
  date: string;
  xp: number;
  rewards: number;
  active: boolean;
}

/** GET /api/gamification/streaks — streak detail + recent daily activity. */
export interface StreaksDTO {
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  streakActive: boolean;
  lastActivityDate: string | null;
  daysSinceLastActivity: number | null;
  daily: DailyActivityDTO[];
}

/* ------------------------------------------------------------------ *
 *  Sprint 2 — Achievements · Badges · Challenges · Celebrations
 * ------------------------------------------------------------------ */

export interface AchievementDTO {
  id: string;
  achievementKey: string;
  title: string;
  description: string;
  category: string;
  rarity: AchievementRarity;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  maxProgress: number;
  /** 0–1 progress ratio (clamped). */
  percent: number;
  metadata: Record<string, unknown>;
}

export interface BadgeDTO {
  id: string;
  badgeKey: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  unlockedAt: string;
}

export interface ChallengeDTO {
  id: string;
  challengeKey: string;
  title: string;
  description: string;
  challengeType: ChallengeType;
  activityType: ActivityType;
  targetValue: number;
  currentProgress: number;
  remaining: number;
  percent: number;
  rewardXP: number;
  rewardBadge: string | null;
  status: ChallengeStatus;
  expiresAt: string;
  /** Seconds until expiry (0 once expired). */
  secondsRemaining: number;
  completedAt: string | null;
}

/** Challenges grouped by cadence for the Challenges page. */
export interface ChallengesDTO {
  active: ChallengeDTO[];
  completed: ChallengeDTO[];
  byType: Record<ChallengeType, ChallengeDTO[]>;
}

export interface CelebrationDTO {
  id: string;
  type: CelebrationType;
  title: string;
  description: string;
  icon: string;
  rarity: string | null;
  xp: number;
  metadata: Record<string, unknown>;
  seen: boolean;
  createdAt: string;
}

/** GET /api/gamification/profile — the unified gamification profile. */
export interface GamificationProfileDTO {
  progression: ProgressionSummaryDTO;
  achievements: {
    unlocked: number;
    total: number;
    recent: AchievementDTO[];
    inProgress: AchievementDTO[];
  };
  badges: {
    count: number;
    recent: BadgeDTO[];
  };
  challenges: {
    active: ChallengeDTO[];
    completedCount: number;
  };
  celebrations: {
    unseen: number;
    recent: CelebrationDTO[];
  };
}
