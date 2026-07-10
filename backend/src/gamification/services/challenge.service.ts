import { challengeRepository } from '../repositories/challenge.repository.js';
import { rewardEngine } from './rewardEngine.service.js';
import { badgeService } from './badge.service.js';
import { celebrationService } from './celebration.service.js';
import { learningRepository } from '../../repositories/learning.repository.js';
import { CHALLENGE_TEMPLATES, type ChallengeTemplate } from '../../config/challenges.js';
import { ApiError } from '../../utils/ApiError.js';
import type { ChallengeDocument } from '../../models/Challenge.js';
import type { ChallengeDTO, ChallengesDTO } from '../dto/gamification.dto.js';
import type { ActivityEvent } from '../../services/activity.service.js';
import type { ChallengeType } from '../../types/domain.js';

const DAY_MS = 86_400_000;

/* -- UTC period helpers: identify the current period + when it ends -- */
function startOfDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}
function dailyPeriod(now: Date): { periodKey: string; expiresAt: Date } {
  const start = startOfDay(now);
  return { periodKey: new Date(start).toISOString().slice(0, 10), expiresAt: new Date(start + DAY_MS) };
}
function weeklyPeriod(now: Date): { periodKey: string; expiresAt: Date } {
  const start = startOfDay(now);
  const dow = (new Date(start).getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  const monday = start - dow * DAY_MS;
  return { periodKey: `W-${new Date(monday).toISOString().slice(0, 10)}`, expiresAt: new Date(monday + 7 * DAY_MS) };
}
function monthlyPeriod(now: Date): { periodKey: string; expiresAt: Date } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  return {
    periodKey: `${y}-${String(m + 1).padStart(2, '0')}`,
    expiresAt: new Date(Date.UTC(y, m + 1, 1)),
  };
}

function toDTO(doc: ChallengeDocument, now: Date): ChallengeDTO {
  const percent = doc.targetValue > 0 ? Math.min(1, doc.currentProgress / doc.targetValue) : 0;
  const secondsRemaining = Math.max(0, Math.round((doc.expiresAt.getTime() - now.getTime()) / 1000));
  return {
    id: String(doc._id),
    challengeKey: doc.challengeKey,
    title: doc.title,
    description: doc.description,
    challengeType: doc.challengeType,
    activityType: doc.activityType,
    targetValue: doc.targetValue,
    currentProgress: Math.min(doc.currentProgress, doc.targetValue),
    remaining: Math.max(0, doc.targetValue - doc.currentProgress),
    percent,
    rewardXP: doc.rewardXP,
    rewardBadge: doc.rewardBadge,
    status: doc.status,
    expiresAt: doc.expiresAt.toISOString(),
    secondsRemaining,
    completedAt: doc.completedAt ? doc.completedAt.toISOString() : null,
  };
}

/**
 * ChallengeService — the challenge lifecycle: generate → advance → complete →
 * reset. Recurring challenges (Daily/Weekly/Monthly) are (re)generated per
 * period on read; Phase challenges track the learner's current phase. Progress
 * accrues from matching activity events; completion mints reward XP through the
 * Reward Engine (never inline) and raises a celebration.
 */
export const challengeService = {
  /** Expire stale challenges and generate the current period's set (idempotent). */
  async ensureActive(userId: string, now: Date = new Date()): Promise<void> {
    await challengeRepository.expireStale(userId, now);

    const periods: Record<Exclude<ChallengeType, 'Custom' | 'Phase'>, { periodKey: string; expiresAt: Date }> = {
      Daily: dailyPeriod(now),
      Weekly: weeklyPeriod(now),
      Monthly: monthlyPeriod(now),
    };

    for (const type of ['Daily', 'Weekly', 'Monthly'] as const) {
      const { periodKey, expiresAt } = periods[type];
      for (const t of CHALLENGE_TEMPLATES[type]) await this.instantiate(userId, t, periodKey, expiresAt);
    }

    // Phase challenges track the current phase; regenerate when the phase changes.
    const ls = await learningRepository.findByUser(userId);
    if (ls?.currentPhaseId) {
      const periodKey = `phase-${String(ls.currentPhaseId)}`;
      const expiresAt = new Date(now.getTime() + 90 * DAY_MS);
      for (const t of CHALLENGE_TEMPLATES.Phase) await this.instantiate(userId, t, periodKey, expiresAt);
    }
  },

  /** Create one challenge instance for a period (no-op if it already exists). */
  async instantiate(userId: string, t: ChallengeTemplate, periodKey: string, expiresAt: Date): Promise<void> {
    await challengeRepository.create({
      userId,
      challengeKey: t.key,
      title: t.title,
      description: t.description,
      challengeType: t.challengeType,
      activityType: t.activityType,
      targetValue: t.targetValue,
      rewardXP: t.rewardXP,
      rewardBadge: t.rewardBadge ?? null,
      periodKey,
      expiresAt,
      currentProgress: 0,
      status: 'Active',
      completedAt: null,
    });
  },

  /** Advance every active challenge the event applies to; complete on target. */
  async advance(userId: string, event: ActivityEvent, now: Date = new Date()): Promise<ChallengeDocument[]> {
    const matching = await challengeRepository.findActiveMatching(userId, event.type, now);
    const completed: ChallengeDocument[] = [];

    for (const ch of matching) {
      const next = Math.min(ch.targetValue, ch.currentProgress + 1);
      if (next === ch.currentProgress) continue;
      const isComplete = next >= ch.targetValue;
      const updated = await challengeRepository.applyProgress(String(ch._id), {
        currentProgress: next,
        ...(isComplete ? { status: 'Completed', completedAt: now } : {}),
      });
      if (isComplete && updated) {
        await this.onComplete(userId, updated, now);
        completed.push(updated);
      }
    }
    return completed;
  },

  /** Grant a completed challenge's rewards + celebration (exactly once). */
  async onComplete(userId: string, ch: ChallengeDocument, now: Date): Promise<void> {
    if (ch.rewardXP > 0) {
      await rewardEngine.awardBonus(userId, {
        amount: ch.rewardXP,
        source: 'challenge-completed',
        sourceKey: `challenge:${String(ch._id)}`,
        reason: `Challenge: ${ch.title}`,
        title: ch.title,
        metadata: { challengeKey: ch.challengeKey, challengeType: ch.challengeType },
        occurredAt: now,
      });
    }
    if (ch.rewardBadge) await badgeService.unlockByKey(userId, ch.rewardBadge, now);

    await celebrationService.celebrate(userId, {
      type: 'challenge-completed',
      title: `Challenge complete — ${ch.title}`,
      description: `${ch.description} · +${ch.rewardXP} XP`,
      icon: '🎯',
      xp: ch.rewardXP,
      metadata: { challengeKey: ch.challengeKey, challengeType: ch.challengeType },
      occurredAt: now,
    });
  },

  /** List challenges, grouped for the Challenges page. */
  async list(userId: string, now: Date = new Date()): Promise<ChallengesDTO> {
    await this.ensureActive(userId, now);
    const docs = await challengeRepository.findByUser(userId);
    const all = docs.map((d) => toDTO(d, now));

    const byType = { Daily: [], Weekly: [], Monthly: [], Phase: [], Custom: [] } as Record<ChallengeType, ChallengeDTO[]>;
    for (const c of all) if (c.status === 'Active') byType[c.challengeType].push(c);

    return {
      active: all.filter((c) => c.status === 'Active'),
      completed: all.filter((c) => c.status === 'Completed'),
      byType,
    };
  },

  /** Active challenges only (for the dashboard/profile). */
  async listActive(userId: string, now: Date = new Date()): Promise<ChallengeDTO[]> {
    await this.ensureActive(userId, now);
    const docs = await challengeRepository.findActive(userId);
    return docs.map((d) => toDTO(d, now));
  },

  /**
   * PATCH /challenges/:id — user-driven actions.
   *   • refresh — re-generate the current challenge set (expire stale + fill).
   *   • dismiss — drop a challenge from the active view (marks it Expired).
   */
  async update(userId: string, id: string, action: 'refresh' | 'dismiss', now: Date = new Date()): Promise<ChallengeDTO> {
    const existing = await challengeRepository.findById(userId, id);
    if (!existing) throw ApiError.notFound('Challenge not found');

    if (action === 'refresh') {
      await this.ensureActive(userId, now);
    } else if (action === 'dismiss') {
      await challengeRepository.applyProgress(id, { status: 'Expired' });
    }

    const updated = (await challengeRepository.findById(userId, id)) ?? existing;
    return toDTO(updated, now);
  },
};
