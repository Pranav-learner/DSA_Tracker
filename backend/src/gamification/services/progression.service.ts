import { userProgressionRepository } from '../repositories/userProgression.repository.js';
import { rewardHistoryRepository, type RewardHistoryFilter } from '../repositories/rewardHistory.repository.js';
import { levelService } from './level.service.js';
import { streakService } from './streak.service.js';
import { progressionCache } from './progressionCache.js';
import { LEVEL_CONFIG, STREAK_CONFIG } from '../../config/gamification.js';
import type { UserProgressionDocument } from '../../models/UserProgression.js';
import type { RewardHistoryDocument } from '../../models/RewardHistory.js';
import type {
  ProgressionSummaryDTO,
  RewardDTO,
  RewardHistoryPageDTO,
  LevelsDTO,
  StreaksDTO,
  DailyActivityDTO,
} from '../dto/gamification.dto.js';
import type { RewardSourceModule } from '../../types/domain.js';

const DAY_MS = 86_400_000;

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function todayStart(now: Date): Date {
  return new Date(startOfUtcDay(now));
}

function toRewardDTO(doc: RewardHistoryDocument): RewardDTO {
  const meta = (doc.metadata ?? {}) as Record<string, unknown>;
  return {
    id: String(doc._id),
    activityId: doc.activityId,
    rewardType: doc.rewardType,
    rewardSource: doc.rewardSource,
    xpAwarded: doc.xpAwarded,
    reason: doc.reason,
    module: (meta.module as RewardSourceModule) ?? null,
    entityType: (meta.entityType as string) ?? null,
    entityId: (meta.entityId as string) ?? null,
    title: (meta.title as string) ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

/**
 * ProgressionService — the read model over the progression state. It never
 * awards XP (that is the RewardEngine's sole job); it composes the summary,
 * level ladder, streak detail and reward history for the API and dashboard.
 *
 * The progression summary is memoised per user (short TTL, invalidated on award)
 * because the dashboard reads it on every load.
 */
export const progressionService = {
  /** Ensure a progression row exists and return it (Level 1 / 0 XP by default). */
  ensure(userId: string): Promise<UserProgressionDocument> {
    return userProgressionRepository.getOrCreate(userId);
  },

  /** GET /progression — the cached progression summary. */
  async getSummary(userId: string): Promise<ProgressionSummaryDTO> {
    const cached = progressionCache.get(userId) as ProgressionSummaryDTO | undefined;
    if (cached) return cached;

    const now = new Date();
    const [doc, todaysXP] = await Promise.all([
      this.ensure(userId),
      rewardHistoryRepository.sumXpSince(userId, todayStart(now)),
    ]);

    // Derive level fresh from totalXP so the summary is self-consistent even if
    // the stored derived fields ever lag (they can always be recomputed).
    const level = levelService.compute(doc.totalXP);
    const streakActive = streakService.isActive(doc.lastActivityDate, now);

    const summary: ProgressionSummaryDTO = {
      level: level.level,
      tier: level.tier,
      totalXP: doc.totalXP,
      currentXP: level.currentXP,
      currentLevelXP: level.currentLevelXP,
      nextLevelXP: level.nextLevelXP,
      xpRemaining: level.xpRemaining,
      levelProgress: level.levelProgress,
      isMaxLevel: level.isMaxLevel,
      currentStreak: doc.currentStreak,
      longestStreak: doc.longestStreak,
      totalDaysActive: doc.totalDaysActive,
      streakActive,
      lastActivityDate: doc.lastActivityDate ? doc.lastActivityDate.toISOString() : null,
      todaysXP,
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
    };

    progressionCache.set(userId, summary);
    return summary;
  },

  /** GET /rewards — the most recent rewards (compact feed). */
  async getRecentRewards(userId: string, limit = 10): Promise<RewardDTO[]> {
    const docs = await rewardHistoryRepository.findRecentByUser(userId, limit);
    return docs.map(toRewardDTO);
  },

  /** GET /rewards/history — filtered, paginated, sortable history. */
  async getRewardHistory(userId: string, filter: RewardHistoryFilter): Promise<RewardHistoryPageDTO> {
    const { items, total } = await rewardHistoryRepository.query(userId, filter);
    return {
      items: items.map(toRewardDTO),
      total,
      limit: filter.limit,
      offset: filter.skip,
      hasMore: filter.skip + items.length < total,
    };
  },

  /** GET /levels — the published ladder plus the user's position on it. */
  async getLevels(userId: string): Promise<LevelsDTO> {
    const doc = await this.ensure(userId);
    const level = levelService.compute(doc.totalXP);
    const ladder = levelService.ladder().map((row) => ({ ...row, isCurrent: row.level === level.level }));

    return {
      formula: LEVEL_CONFIG.formula,
      baseXP: LEVEL_CONFIG.baseXP,
      exponent: LEVEL_CONFIG.exponent,
      maxLevel: LEVEL_CONFIG.maxLevel,
      currentLevel: level.level,
      currentXP: level.currentXP,
      nextLevelXP: level.nextLevelXP,
      levelProgress: level.levelProgress,
      ladder,
    };
  },

  /** GET /streaks — streak detail plus a recent daily-activity breakdown. */
  async getStreaks(userId: string): Promise<StreaksDTO> {
    const now = new Date();
    const windowDays = STREAK_CONFIG.dailyBreakdownDays;
    const since = new Date(startOfUtcDay(now) - (windowDays - 1) * DAY_MS);

    const [doc, totals] = await Promise.all([
      this.ensure(userId),
      rewardHistoryRepository.dailyTotalsSince(userId, since),
    ]);

    const byDay = new Map(totals.map((t) => [t._id, t]));
    const daily: DailyActivityDTO[] = [];
    for (let i = windowDays - 1; i >= 0; i -= 1) {
      const dayStart = startOfUtcDay(now) - i * DAY_MS;
      const key = new Date(dayStart).toISOString().slice(0, 10);
      const hit = byDay.get(key);
      daily.push({ date: key, xp: hit?.xp ?? 0, rewards: hit?.count ?? 0, active: (hit?.count ?? 0) > 0 });
    }

    const streakActive = streakService.isActive(doc.lastActivityDate, now);
    const daysSinceLastActivity = doc.lastActivityDate
      ? Math.round((startOfUtcDay(now) - startOfUtcDay(doc.lastActivityDate)) / DAY_MS)
      : null;

    return {
      currentStreak: doc.currentStreak,
      longestStreak: doc.longestStreak,
      totalDaysActive: doc.totalDaysActive,
      streakActive,
      lastActivityDate: doc.lastActivityDate ? doc.lastActivityDate.toISOString() : null,
      daysSinceLastActivity,
      daily,
    };
  },
};
