import { badgeRepository } from '../repositories/badge.repository.js';
import { celebrationService } from './celebration.service.js';
import { BADGE_DEFS, BADGE_BY_KEY, type BadgeDef } from '../../config/badges.js';
import type { RuleContext } from '../../config/achievements.js';
import type { BadgeDocument } from '../../models/Badge.js';
import type { BadgeDTO } from '../dto/gamification.dto.js';

function toDTO(doc: BadgeDocument): BadgeDTO {
  return {
    id: String(doc._id),
    badgeKey: doc.badgeKey,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    icon: doc.icon,
    unlockedAt: doc.unlockedAt.toISOString(),
  };
}

/**
 * BadgeService — unlocks and lists badges. A badge unlocks either from its own
 * metric condition (evaluated each event) or because an achievement/challenge
 * awarded it (`unlockByKey`). Both funnel through the repository's unique index,
 * so a badge is granted exactly once; every fresh unlock raises a celebration.
 */
export const badgeService = {
  /** Evaluate every badge's self-standing condition; unlock newly-earned ones. */
  async evaluate(userId: string, ctx: RuleContext, occurredAt?: Date): Promise<BadgeDocument[]> {
    const unlocked: BadgeDocument[] = [];
    for (const def of BADGE_DEFS) {
      if (!def.unlocked(ctx)) continue;
      const doc = await this.unlock(userId, def, occurredAt);
      if (doc) unlocked.push(doc);
    }
    return unlocked;
  },

  /** Unlock a badge by key (used when an achievement/challenge grants one). */
  async unlockByKey(userId: string, badgeKey: string, occurredAt?: Date): Promise<BadgeDocument | null> {
    const def = BADGE_BY_KEY[badgeKey];
    if (!def) return null;
    return this.unlock(userId, def, occurredAt);
  },

  /** Award a badge (idempotent). Emits a celebration on a fresh unlock. */
  async unlock(userId: string, def: BadgeDef, occurredAt?: Date): Promise<BadgeDocument | null> {
    const doc = await badgeRepository.unlock({
      userId,
      badgeKey: def.key,
      title: def.title,
      description: def.description,
      category: def.category,
      icon: def.icon,
      unlockedAt: occurredAt ?? new Date(),
    });
    if (!doc) return null; // already earned

    await celebrationService.celebrate(userId, {
      type: 'badge-earned',
      title: `Badge earned — ${def.title}`,
      description: def.description,
      icon: def.icon,
      metadata: { badgeKey: def.key, category: def.category },
      occurredAt,
    });
    return doc;
  },

  async list(userId: string): Promise<BadgeDTO[]> {
    const docs = await badgeRepository.findByUser(userId);
    return docs.map(toDTO);
  },
};
