import { UserProblem } from '../../models/UserProblem.js';
import { NotebookEntry } from '../../models/NotebookEntry.js';
import { RevisionSession } from '../../models/RevisionSession.js';
import { Activity } from '../../models/Activity.js';
import { TopicProgress } from '../../models/TopicProgress.js';
import type { Difficulty, Platform } from '../../types/domain.js';

/**
 * Analytics repository — owns the NEW cross-collection aggregation pipelines the
 * analytics layer needs and that no existing feature repository provides
 * (solved-problem distributions, activity day-buckets, session stats…). It only
 * READS existing collections; it never writes and holds no business rules.
 */
export const analyticsRepository = {
  /** Solved/attempted counts, solved-time total and solved distributions. */
  async problemStats(userId: string): Promise<{
    attempted: number;
    solved: number;
    solvedTime: number;
    byPlatform: { key: Platform; count: number }[];
    byDifficulty: { key: Difficulty; count: number }[];
  }> {
    const [row] = await UserProblem.aggregate([
      { $match: { userId } },
      { $lookup: { from: 'problems', localField: 'problemId', foreignField: '_id', as: 'p' } },
      { $unwind: '$p' },
      {
        $facet: {
          counts: [
            {
              $group: {
                _id: null,
                attempted: { $sum: { $cond: [{ $gt: ['$totalAttempts', 0] }, 1, 0] } },
                solved: { $sum: { $cond: ['$solved', 1, 0] } },
                solvedTime: { $sum: { $cond: ['$solved', '$totalTimeSpent', 0] } },
              },
            },
          ],
          byPlatform: [
            { $match: { solved: true } },
            { $group: { _id: '$p.platform', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          byDifficulty: [
            { $match: { solved: true } },
            { $group: { _id: '$p.difficulty', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
        },
      },
    ]).exec();

    const counts = row?.counts?.[0] ?? { attempted: 0, solved: 0, solvedTime: 0 };
    return {
      attempted: counts.attempted ?? 0,
      solved: counts.solved ?? 0,
      solvedTime: counts.solvedTime ?? 0,
      byPlatform: (row?.byPlatform ?? []).map((r: { _id: Platform; count: number }) => ({ key: r._id, count: r.count })),
      byDifficulty: (row?.byDifficulty ?? []).map((r: { _id: Difficulty; count: number }) => ({ key: r._id, count: r.count })),
    };
  },

  /**
   * Per-topic problem behaviour — solved/attempted, solve time and hint/editorial
   * dependency, grouped by the problem's topic. Powers pattern intelligence.
   */
  async problemStatsByTopic(userId: string): Promise<
    Map<
      string,
      { attempted: number; solved: number; solvedTime: number; solvedWithHint: number; solvedWithEditorial: number }
    >
  > {
    const rows = await UserProblem.aggregate([
      { $match: { userId } },
      { $lookup: { from: 'problems', localField: 'problemId', foreignField: '_id', as: 'p' } },
      { $unwind: '$p' },
      {
        $group: {
          _id: '$p.topicId',
          attempted: { $sum: { $cond: [{ $gt: ['$totalAttempts', 0] }, 1, 0] } },
          solved: { $sum: { $cond: ['$solved', 1, 0] } },
          solvedTime: { $sum: { $cond: ['$solved', '$totalTimeSpent', 0] } },
          solvedWithHint: { $sum: { $cond: [{ $and: ['$solved', { $eq: ['$solvedWithoutHint', false] }] }, 1, 0] } },
          solvedWithEditorial: {
            $sum: { $cond: [{ $and: ['$solved', { $eq: ['$solvedWithoutEditorial', false] }] }, 1, 0] },
          },
        },
      },
    ]).exec();

    const map = new Map<
      string,
      { attempted: number; solved: number; solvedTime: number; solvedWithHint: number; solvedWithEditorial: number }
    >();
    for (const r of rows as Array<{ _id: unknown; attempted: number; solved: number; solvedTime: number; solvedWithHint: number; solvedWithEditorial: number }>) {
      if (r._id) {
        map.set(String(r._id), {
          attempted: r.attempted,
          solved: r.solved,
          solvedTime: r.solvedTime,
          solvedWithHint: r.solvedWithHint,
          solvedWithEditorial: r.solvedWithEditorial,
        });
      }
    }
    return map;
  },

  /** Average notebook confidence + entry count (0 when empty). */
  async notebookConfidence(userId: string): Promise<{ averageConfidence: number; count: number }> {
    const [row] = await NotebookEntry.aggregate([
      { $match: { userId } },
      { $group: { _id: null, averageConfidence: { $avg: '$confidence' }, count: { $sum: 1 } } },
    ]).exec();
    return { averageConfidence: Math.round(row?.averageConfidence ?? 0), count: row?.count ?? 0 };
  },

  /** Completed-session stats within an optional window: count, avg duration, active days. */
  async sessionStats(
    userId: string,
    since: Date | null,
  ): Promise<{ completed: number; averageDuration: number; activeDays: number }> {
    const match: Record<string, unknown> = { userId, sessionStatus: 'Completed' };
    if (since) match.completedAt = { $gte: since };
    const [row] = await RevisionSession.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          completed: { $sum: 1 },
          averageDuration: { $avg: '$durationMinutes' },
          days: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } } },
        },
      },
    ]).exec();
    return {
      completed: row?.completed ?? 0,
      averageDuration: Math.round(row?.averageDuration ?? 0),
      activeDays: row?.days?.length ?? 0,
    };
  },

  /** Daily activity buckets within an optional window (ascending by date). */
  async activityDaily(userId: string, since: Date | null): Promise<{ date: string; count: number }[]> {
    const match: Record<string, unknown> = { userId };
    if (since) match.createdAt = { $gte: since };
    const rows = await Activity.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]).exec();
    return rows.map((r: { _id: string; count: number }) => ({ date: r._id, count: r.count }));
  },

  /** Distinct activity day-keys across ALL history (for streak computation). */
  async activityDayKeys(userId: string): Promise<string[]> {
    const rows = await Activity.aggregate([
      { $match: { userId } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } } },
      { $sort: { _id: 1 } },
    ]).exec();
    return rows.map((r: { _id: string }) => r._id);
  },

  /** Count of topics completed within an optional window (for learning velocity). */
  async topicsCompletedSince(userId: string, since: Date | null): Promise<number> {
    const match: Record<string, unknown> = {
      userId,
      status: { $in: ['Completed', 'Mastered'] },
      completedAt: since ? { $gte: since, $ne: null } : { $ne: null },
    };
    return TopicProgress.countDocuments(match).exec();
  },

  /** Newest activity timestamp for a user — the analytics cache freshness token. */
  async latestActivityAt(userId: string): Promise<number> {
    const [row] = await Activity.aggregate([
      { $match: { userId } },
      { $group: { _id: null, latest: { $max: '$createdAt' } } },
    ]).exec();
    return row?.latest ? new Date(row.latest).getTime() : 0;
  },
};
