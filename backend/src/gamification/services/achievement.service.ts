import { achievementRepository } from '../repositories/achievement.repository.js';
import { badgeService } from './badge.service.js';
import { celebrationService } from './celebration.service.js';
import { rewardEngine } from './rewardEngine.service.js';
import { ACHIEVEMENT_DEFS, type RuleContext, type AchievementDef } from '../../config/achievements.js';
import type { AchievementDocument } from '../../models/Achievement.js';
import type { AchievementDTO } from '../dto/gamification.dto.js';

function toDTO(doc: AchievementDocument): AchievementDTO {
  const percent = doc.maxProgress > 0 ? Math.min(1, doc.progress / doc.maxProgress) : 0;
  return {
    id: String(doc._id),
    achievementKey: doc.achievementKey,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    rarity: doc.rarity,
    icon: doc.icon,
    unlocked: doc.unlockedAt !== null,
    unlockedAt: doc.unlockedAt ? doc.unlockedAt.toISOString() : null,
    progress: Math.min(doc.progress, doc.maxProgress),
    maxProgress: doc.maxProgress,
    percent,
    metadata: (doc.metadata ?? {}) as Record<string, unknown>,
  };
}

/**
 * AchievementService — evaluates the achievement catalogue against a rule
 * context, tracks progress, and unlocks newly-completed achievements exactly
 * once. On unlock it: grants bonus XP through the Reward Engine (never inline),
 * unlocks any linked badge, and raises a celebration.
 *
 * `evaluate` performs a single pass and reports whether anything unlocked, so
 * the ProgressionRulesEngine can iterate to a fixpoint (bonus XP from one unlock
 * can complete an XP-threshold achievement in the next pass).
 */
export const achievementService = {
  async evaluate(userId: string, ctx: RuleContext, occurredAt?: Date): Promise<AchievementDocument[]> {
    const unlocked: AchievementDocument[] = [];

    for (const def of ACHIEVEMENT_DEFS) {
      const progress = Math.max(0, Math.min(def.maxProgress, Math.floor(def.progress(ctx))));

      // Sync the row's progress + denormalised catalogue fields.
      await achievementRepository.upsert(userId, def.key, {
        title: def.title,
        description: def.description,
        category: def.category,
        rarity: def.rarity,
        icon: def.icon,
        maxProgress: def.maxProgress,
        progress,
      });

      if (progress < def.maxProgress) continue;

      // Atomically claim the unlock (null → already unlocked / lost the race).
      const doc = await achievementRepository.unlockIfNeeded(userId, def.key, occurredAt ?? new Date());
      if (!doc) continue;

      await this.onUnlock(userId, def, occurredAt);
      unlocked.push(doc);
    }

    return unlocked;
  },

  /** Fire the side-effects of a fresh unlock (bonus XP, badge, celebration). */
  async onUnlock(userId: string, def: AchievementDef, occurredAt?: Date): Promise<void> {
    if (def.bonusXP && def.bonusXP > 0) {
      await rewardEngine.awardBonus(userId, {
        amount: def.bonusXP,
        source: 'achievement-unlocked',
        sourceKey: `achievement:${def.key}`,
        reason: `Achievement: ${def.title}`,
        title: def.title,
        metadata: { achievementKey: def.key, rarity: def.rarity },
        occurredAt,
      });
    }

    if (def.badgeKey) await badgeService.unlockByKey(userId, def.badgeKey, occurredAt);

    await celebrationService.celebrate(userId, {
      type: 'achievement-unlocked',
      title: `Achievement unlocked — ${def.title}`,
      description: def.description,
      icon: def.icon,
      rarity: def.rarity,
      xp: def.bonusXP ?? 0,
      metadata: { achievementKey: def.key, category: def.category },
      occurredAt,
    });
  },

  /**
   * The full catalogue merged with the user's stored rows — so locked, never-yet-
   * touched achievements still render (progress 0). This is the source for the
   * Achievements page and the profile.
   */
  async list(userId: string): Promise<AchievementDTO[]> {
    const rows = await achievementRepository.findByUser(userId);
    const byKey = new Map(rows.map((r) => [r.achievementKey, r]));
    return ACHIEVEMENT_DEFS.map((def) => {
      const row = byKey.get(def.key);
      return row ? toDTO(row) : lockedDTO(def);
    });
  },

  async getByKey(userId: string, achievementKey: string): Promise<AchievementDTO | null> {
    const doc = await achievementRepository.findByKey(userId, achievementKey);
    if (doc) return toDTO(doc);
    const def = ACHIEVEMENT_DEFS.find((d) => d.key === achievementKey);
    return def ? lockedDTO(def) : null;
  },
};

/** A synthetic locked DTO for a catalogue achievement with no stored row yet. */
function lockedDTO(def: AchievementDef): AchievementDTO {
  return {
    id: def.key,
    achievementKey: def.key,
    title: def.title,
    description: def.description,
    category: def.category,
    rarity: def.rarity,
    icon: def.icon,
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: def.maxProgress,
    percent: 0,
    metadata: {},
  };
}
