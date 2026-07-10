import { celebrationRepository } from '../repositories/celebration.repository.js';
import { activityService } from '../../services/activity.service.js';
import type { CelebrationDocument } from '../../models/Celebration.js';
import type { CelebrationDTO } from '../dto/gamification.dto.js';
import type { CelebrationType, ActivityType, ActivityEntityType } from '../../types/domain.js';

/** Which Activity-timeline event mirrors each celebration (null = don't mirror). */
const CELEBRATION_ACTIVITY: Record<CelebrationType, { type: ActivityType; entity: ActivityEntityType } | null> = {
  'achievement-unlocked': { type: 'achievement-unlocked', entity: 'achievement' },
  'badge-earned': { type: 'badge-earned', entity: 'badge' },
  'challenge-completed': { type: 'challenge-completed', entity: 'challenge' },
  'milestone-reached': { type: 'milestone-reached', entity: 'progression' },
  // Level-up is already recorded on the timeline by the Reward Engine — don't duplicate.
  'level-up': null,
};

export interface CelebrationInput {
  type: CelebrationType;
  title: string;
  description: string;
  icon: string;
  rarity?: string | null;
  xp?: number;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}

function toDTO(doc: CelebrationDocument): CelebrationDTO {
  return {
    id: String(doc._id),
    type: doc.type,
    title: doc.title,
    description: doc.description,
    icon: doc.icon,
    rarity: doc.rarity,
    xp: doc.xp,
    metadata: (doc.metadata ?? {}) as Record<string, unknown>,
    seen: doc.seen,
    createdAt: doc.createdAt.toISOString(),
  };
}

/**
 * CelebrationService — turns progression milestones into frontend-friendly
 * celebration events. It stores a Celebration (data only — no UI/animation
 * logic) and mirrors the moment onto the Activity timeline, reusing the same
 * Activity system every module writes to. The timeline mirror uses non-rewardable
 * event types, so it never loops back into the reward/rules engines.
 */
export const celebrationService = {
  async celebrate(userId: string, input: CelebrationInput): Promise<void> {
    await celebrationRepository.create({
      userId,
      type: input.type,
      title: input.title,
      description: input.description,
      icon: input.icon,
      rarity: input.rarity ?? null,
      xp: input.xp ?? 0,
      metadata: input.metadata ?? {},
      createdAt: input.occurredAt ?? new Date(),
    });

    const mirror = CELEBRATION_ACTIVITY[input.type];
    if (mirror) {
      await activityService.record(userId, {
        type: mirror.type,
        entityType: mirror.entity,
        entityId: null,
        title: input.title,
        description: input.description,
      });
    }
  },

  async getRecent(userId: string, opts: { unseenOnly?: boolean; limit?: number } = {}): Promise<CelebrationDTO[]> {
    const docs = await celebrationRepository.findRecent(userId, opts);
    return docs.map(toDTO);
  },

  countUnseen(userId: string): Promise<number> {
    return celebrationRepository.countUnseen(userId);
  },

  markSeen(userId: string, ids?: string[]): Promise<number> {
    return celebrationRepository.markSeen(userId, ids);
  },
};
