import { Attempt, type AttemptDocument, type IAttempt } from '../models/Attempt.js';

/**
 * Attempt repository — sole owner of Attempt MongoDB operations. Soft-deleted
 * rows (`deletedAt != null`) are excluded from every read except by id.
 */
export const attemptRepository = {
  create(input: Partial<IAttempt>): Promise<AttemptDocument> {
    return Attempt.create(input);
  },

  findById(id: string): Promise<AttemptDocument | null> {
    return Attempt.findById(id).exec();
  },

  /** A user's live attempts on a problem, newest first (history + sync source). */
  findByUserAndProblem(userId: string, problemId: string): Promise<AttemptDocument[]> {
    return Attempt.find({ userId, problemId, deletedAt: null }).sort({ createdAt: -1 }).exec();
  },

  /**
   * Highest attemptNumber ever used for (user, problem) — including soft-deleted
   * rows — so numbering stays monotonic and never reuses a number.
   */
  async maxAttemptNumber(userId: string, problemId: string): Promise<number> {
    const last = await Attempt.findOne({ userId, problemId })
      .sort({ attemptNumber: -1 })
      .select('attemptNumber')
      .exec();
    return last?.attemptNumber ?? 0;
  },

  updateById(id: string, patch: Partial<IAttempt>): Promise<AttemptDocument | null> {
    return Attempt.findByIdAndUpdate(id, { $set: patch }, { new: true }).exec();
  },

  /** Soft delete — preserves the record but removes it from history/aggregates. */
  softDeleteById(id: string, when: Date): Promise<AttemptDocument | null> {
    return Attempt.findByIdAndUpdate(id, { $set: { deletedAt: when } }, { new: true }).exec();
  },

  deleteByUser(userId: string): Promise<unknown> {
    return Attempt.deleteMany({ userId }).exec();
  },
};
