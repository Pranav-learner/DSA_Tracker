import { Challenge, type ChallengeDocument, type IChallenge } from '../../models/Challenge.js';
import type { ActivityType, ChallengeStatus } from '../../types/domain.js';

export type ChallengeInput = Omit<IChallenge, 'createdAt' | 'updatedAt' | 'currentProgress' | 'completedAt' | 'status'> &
  Partial<Pick<IChallenge, 'currentProgress' | 'completedAt' | 'status'>>;

const DUPLICATE_KEY = 11000;
function isDuplicate(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === DUPLICATE_KEY;
}

/**
 * Challenge repository — sole owner of Challenge MongoDB operations. Creation is
 * idempotent per {userId, challengeKey, periodKey} (unique index) so regenerating
 * a period's challenge set never duplicates rows.
 */
export const challengeRepository = {
  findByUser(userId: string, status?: ChallengeStatus): Promise<ChallengeDocument[]> {
    const q: Record<string, unknown> = { userId };
    if (status) q.status = status;
    return Challenge.find(q).sort({ status: 1, expiresAt: 1 }).exec();
  },

  findActive(userId: string): Promise<ChallengeDocument[]> {
    return Challenge.find({ userId, status: 'Active' }).sort({ expiresAt: 1 }).exec();
  },

  findById(userId: string, id: string): Promise<ChallengeDocument | null> {
    return Challenge.findOne({ _id: id, userId }).exec();
  },

  /** Active, non-expired challenges advanced by a given activity type. */
  findActiveMatching(userId: string, activityType: ActivityType, now: Date): Promise<ChallengeDocument[]> {
    return Challenge.find({
      userId,
      status: 'Active',
      activityType,
      expiresAt: { $gt: now },
    }).exec();
  },

  /** Create a challenge instance; `null` if one already exists for the period. */
  async create(input: ChallengeInput): Promise<ChallengeDocument | null> {
    try {
      return await Challenge.create(input);
    } catch (err) {
      if (isDuplicate(err)) return null;
      throw err;
    }
  },

  /** Persist a progress/status change (used on advance + complete). */
  applyProgress(
    id: string,
    fields: Partial<Pick<IChallenge, 'currentProgress' | 'status' | 'completedAt'>>,
  ): Promise<ChallengeDocument | null> {
    return Challenge.findByIdAndUpdate(id, { $set: fields }, { new: true }).exec();
  },

  /** Expire all Active challenges past their deadline; return the count expired. */
  async expireStale(userId: string, now: Date): Promise<number> {
    const res = await Challenge.updateMany(
      { userId, status: 'Active', expiresAt: { $lte: now } },
      { $set: { status: 'Expired' } },
    ).exec();
    return res.modifiedCount ?? 0;
  },

  deleteByUser(userId: string): Promise<unknown> {
    return Challenge.deleteMany({ userId }).exec();
  },
};
