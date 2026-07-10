import { Recommendation, type RecommendationDocument, type IRecommendation } from '../../models/Recommendation.js';
import type { RecommendationStatus } from '../os/types.js';

/** The descriptive fields set on every (re)generation (never resets lifecycle). */
export type RecommendationSeed = Pick<
  IRecommendation,
  'title' | 'reason' | 'priority' | 'source' | 'action' | 'intent' | 'coachId'
>;

export interface RecommendationFilter {
  status?: RecommendationStatus;
  /** Exclude these statuses (e.g. hide dismissed/archived by default). */
  notStatuses?: RecommendationStatus[];
  limit?: number;
}

/**
 * Recommendation repository — sole owner of Recommendation MongoDB operations.
 * Every read is scoped by `userId` (ownership at the data layer). Upsert-by-key
 * lets regeneration refresh a recommendation's text WITHOUT resetting the
 * lifecycle status the learner has driven.
 */
export const recommendationRepository = {
  list(userId: string, filter: RecommendationFilter = {}): Promise<RecommendationDocument[]> {
    const q: Record<string, unknown> = { userId };
    if (filter.status) q.status = filter.status;
    else if (filter.notStatuses?.length) q.status = { $nin: filter.notStatuses };
    return Recommendation.find(q).sort({ updatedAt: -1 }).limit(filter.limit ?? 100).exec();
  },

  findById(userId: string, id: string): Promise<RecommendationDocument | null> {
    return Recommendation.findOne({ _id: id, userId }).exec();
  },

  /** Insert (status 'generated') or refresh the descriptive fields for (user, key). */
  upsertByKey(userId: string, key: string, seed: RecommendationSeed): Promise<RecommendationDocument | null> {
    return Recommendation.findOneAndUpdate(
      { userId, key },
      { $set: { ...seed }, $setOnInsert: { status: 'generated' } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  },

  update(userId: string, id: string, patch: Partial<IRecommendation>): Promise<RecommendationDocument | null> {
    return Recommendation.findOneAndUpdate({ _id: id, userId }, { $set: patch }, { new: true }).exec();
  },

  /** Lifecycle counts for the effectiveness roll-up. */
  async statusCounts(userId: string): Promise<Record<RecommendationStatus, number>> {
    const rows = await Recommendation.aggregate<{ _id: RecommendationStatus; n: number }>([
      { $match: { userId } },
      { $group: { _id: '$status', n: { $sum: 1 } } },
    ]).exec();
    const out = { generated: 0, viewed: 0, accepted: 0, dismissed: 0, completed: 0, archived: 0 } as Record<RecommendationStatus, number>;
    for (const r of rows) out[r._id] = r.n;
    return out;
  },
};
