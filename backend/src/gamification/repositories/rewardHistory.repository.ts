import { RewardHistory, type RewardHistoryDocument, type IRewardHistory } from '../../models/RewardHistory.js';
import type { RewardType, ActivityType } from '../../types/domain.js';

/** Shape accepted when minting a reward row. */
export type RewardInput = Omit<IRewardHistory, 'createdAt'> & { createdAt?: Date };

/** Filters for the reward-history query endpoint. */
export interface RewardHistoryFilter {
  rewardType?: RewardType;
  rewardSource?: ActivityType;
  /** Inclusive lower/upper bounds on createdAt (ISO or Date). */
  from?: Date;
  to?: Date;
  sort?: 'newest' | 'oldest';
  limit: number;
  skip: number;
}

/** MongoDB duplicate-key error code (unique index violation). */
const DUPLICATE_KEY = 11000;

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === DUPLICATE_KEY;
}

/**
 * RewardHistory repository — sole owner of RewardHistory MongoDB operations.
 * `create` returns `null` on a duplicate (same user+activity) rather than
 * throwing, so the engine can treat "already rewarded" as a normal no-op.
 */
export const rewardHistoryRepository = {
  /** Insert a reward row. Returns `null` if this activity was already rewarded. */
  async create(input: RewardInput): Promise<RewardHistoryDocument | null> {
    try {
      return await RewardHistory.create(input);
    } catch (err) {
      if (isDuplicateKeyError(err)) return null;
      throw err;
    }
  },

  existsForActivity(userId: string, activityId: string): Promise<boolean> {
    return RewardHistory.exists({ userId, activityId })
      .exec()
      .then((doc) => doc !== null);
  },

  findRecentByUser(userId: string, limit = 10): Promise<RewardHistoryDocument[]> {
    return RewardHistory.find({ userId }).sort({ createdAt: -1 }).limit(limit).exec();
  },

  /** Filtered, paginated history read. Returns the page plus the total count. */
  async query(
    userId: string,
    filter: RewardHistoryFilter,
  ): Promise<{ items: RewardHistoryDocument[]; total: number }> {
    const q: Record<string, unknown> = { userId };
    if (filter.rewardType) q.rewardType = filter.rewardType;
    if (filter.rewardSource) q.rewardSource = filter.rewardSource;
    if (filter.from || filter.to) {
      const range: Record<string, Date> = {};
      if (filter.from) range.$gte = filter.from;
      if (filter.to) range.$lte = filter.to;
      q.createdAt = range;
    }

    const order = filter.sort === 'oldest' ? 1 : -1;
    const [items, total] = await Promise.all([
      RewardHistory.find(q).sort({ createdAt: order }).skip(filter.skip).limit(filter.limit).exec(),
      RewardHistory.countDocuments(q).exec(),
    ]);
    return { items, total };
  },

  /** Sum XP awarded to a user at or after `since` (used for "Today's XP"). */
  async sumXpSince(userId: string, since: Date): Promise<number> {
    const [row] = await RewardHistory.aggregate<{ total: number }>([
      { $match: { userId, createdAt: { $gte: since } } },
      { $group: { _id: null, total: { $sum: '$xpAwarded' } } },
    ]).exec();
    return row?.total ?? 0;
  },

  /** Lifetime reward counts grouped by activity type (rewardSource). */
  async countsBySource(userId: string): Promise<Record<string, number>> {
    const rows = await RewardHistory.aggregate<{ _id: string; count: number }>([
      { $match: { userId } },
      { $group: { _id: '$rewardSource', count: { $sum: 1 } } },
    ]).exec();
    return Object.fromEntries(rows.map((r) => [r._id, r.count]));
  },

  /** Distinct earned titles per source (for keyword/category rules). */
  async titlesBySource(userId: string, sources: string[]): Promise<Record<string, string[]>> {
    const rows = await RewardHistory.aggregate<{ _id: string; titles: string[] }>([
      { $match: { userId, rewardSource: { $in: sources } } },
      { $group: { _id: '$rewardSource', titles: { $addToSet: '$metadata.title' } } },
    ]).exec();
    return Object.fromEntries(rows.map((r) => [r._id, r.titles.filter((t): t is string => typeof t === 'string')]));
  },

  /** Per-day XP + reward counts at or after `since`, for the streak breakdown. */
  dailyTotalsSince(
    userId: string,
    since: Date,
  ): Promise<{ _id: string; xp: number; count: number }[]> {
    return RewardHistory.aggregate<{ _id: string; xp: number; count: number }>([
      { $match: { userId, createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
          xp: { $sum: '$xpAwarded' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).exec();
  },

  deleteByUser(userId: string): Promise<unknown> {
    return RewardHistory.deleteMany({ userId }).exec();
  },
};
