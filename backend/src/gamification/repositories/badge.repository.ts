import { Badge, type BadgeDocument, type IBadge } from '../../models/Badge.js';

export type BadgeInput = Omit<IBadge, 'createdAt' | 'updatedAt' | 'unlockedAt'> & { unlockedAt?: Date };

const DUPLICATE_KEY = 11000;
function isDuplicate(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === DUPLICATE_KEY;
}

/**
 * Badge repository — sole owner of Badge MongoDB operations. `unlock` returns
 * `null` when the badge already exists (unique {userId, badgeKey}), so the
 * service treats a repeat award as a normal no-op.
 */
export const badgeRepository = {
  findByUser(userId: string): Promise<BadgeDocument[]> {
    return Badge.find({ userId }).sort({ unlockedAt: -1 }).exec();
  },

  /** Award a badge. Returns the new doc, or `null` if already earned. */
  async unlock(input: BadgeInput): Promise<BadgeDocument | null> {
    try {
      return await Badge.create(input);
    } catch (err) {
      if (isDuplicate(err)) return null;
      throw err;
    }
  },

  exists(userId: string, badgeKey: string): Promise<boolean> {
    return Badge.exists({ userId, badgeKey })
      .exec()
      .then((d) => d !== null);
  },

  deleteByUser(userId: string): Promise<unknown> {
    return Badge.deleteMany({ userId }).exec();
  },
};
