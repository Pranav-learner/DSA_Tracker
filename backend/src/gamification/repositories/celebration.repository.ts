import { Celebration, type CelebrationDocument, type ICelebration } from '../../models/Celebration.js';

export type CelebrationInput = Omit<ICelebration, 'createdAt' | 'seen'> & { createdAt?: Date; seen?: boolean };

/**
 * Celebration repository — sole owner of Celebration MongoDB operations. Feeds
 * the frontend celebration queue (toasts/modals); `markSeen` lets the client
 * acknowledge celebrations it has already shown.
 */
export const celebrationRepository = {
  create(input: CelebrationInput): Promise<CelebrationDocument> {
    return Celebration.create(input);
  },

  findRecent(userId: string, opts: { unseenOnly?: boolean; limit?: number } = {}): Promise<CelebrationDocument[]> {
    const q: Record<string, unknown> = { userId };
    if (opts.unseenOnly) q.seen = false;
    return Celebration.find(q)
      .sort({ createdAt: -1 })
      .limit(opts.limit ?? 20)
      .exec();
  },

  countUnseen(userId: string): Promise<number> {
    return Celebration.countDocuments({ userId, seen: false }).exec();
  },

  /** Mark specific celebrations (or all) as seen. Returns the modified count. */
  async markSeen(userId: string, ids?: string[]): Promise<number> {
    const q: Record<string, unknown> = { userId, seen: false };
    if (ids && ids.length) q._id = { $in: ids };
    const res = await Celebration.updateMany(q, { $set: { seen: true } }).exec();
    return res.modifiedCount ?? 0;
  },

  deleteByUser(userId: string): Promise<unknown> {
    return Celebration.deleteMany({ userId }).exec();
  },
};
