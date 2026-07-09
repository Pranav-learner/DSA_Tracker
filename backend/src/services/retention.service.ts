import { Types } from 'mongoose';
import { retentionRepository } from '../repositories/retention.repository.js';
import { revisionScheduleRepository } from '../repositories/revisionSchedule.repository.js';
import { notebookRepository } from '../repositories/notebook.repository.js';
import { confidenceService } from './confidence.service.js';
import { getDecayStrategy } from './decayStrategy.js';
import { topicProgressService } from './topicProgress.service.js';
import { activityService } from './activity.service.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { daysUntil, dayKey } from './revision.util.js';
import {
  RETENTION_LEVEL_THRESHOLDS,
  AT_RISK_OVERDUE_DAYS,
  RETENTION_WEIGHTS,
  RETENTION_HISTORY_LIMIT,
  CONFIDENCE_CONFIG,
} from '../config/retention.js';
import type { ActivityType, RetentionLevel, RevisionEntityType } from '../types/domain.js';
import type { IRetentionSnapshot, RetentionProfileDocument } from '../models/RetentionProfile.js';
import type { RevisionSessionDTO } from './revisionSession.dto.js';
import type {
  ConfidenceOverviewDTO,
  ConfidenceTrendDTO,
  DashboardRetentionDTO,
  RetentionHistoryRowDTO,
  RetentionOverviewDTO,
  RetentionProfileDTO,
  RetentionProfileRefDTO,
  RetentionSnapshotDTO,
} from './retention.dto.js';

const round = (n: number) => Math.round(n);
const clamp = (n: number) => Math.max(0, Math.min(100, n));
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

const LEVEL_RANK: Record<RetentionLevel, number> = {
  'At Risk': 0,
  'Needs Review': 1,
  Learning: 2,
  Familiar: 3,
  Strong: 4,
  Mastered: 5,
};

export interface EnsureProfileInput {
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  topicId?: string | null;
}

/**
 * RetentionService — the intelligence layer. Maintains one RetentionProfile per
 * entity: updates confidence/retention after reviews, applies time decay via the
 * DecayStrategy, derives the retention level, and **synchronises mastery** by
 * feeding the confidence signal into the Module 1 engine (reused, not duplicated).
 * All business rules live here.
 */
export const retentionService = {
  async ensureProfile(userId: string, input: EnsureProfileInput): Promise<RetentionProfileDocument> {
    const existing = await retentionRepository.findByEntity(userId, input.entityId);
    if (existing) return existing;
    return retentionRepository.create({
      userId,
      entityType: input.entityType,
      entityId: input.entityId,
      title: input.title,
      topicId: input.topicId ? new Types.ObjectId(input.topicId) : null,
      confidenceScore: CONFIDENCE_CONFIG.default,
      retentionScore: computeRetention(CONFIDENCE_CONFIG.default, 0, 0),
      decayScore: getDecayStrategy().dailyRate(0),
      currentLevel: 'Learning',
      strategy: 'default',
      history: [],
    });
  },

  async getByEntity(userId: string, entityId: string): Promise<RetentionProfileDTO | null> {
    const doc = await retentionRepository.findByEntity(userId, entityId);
    return doc ? this.toProfileDTO(doc, new Date()) : null;
  },

  async listProfiles(userId: string, entityType?: RevisionEntityType): Promise<RetentionProfileDTO[]> {
    const docs = await retentionRepository.findAll(userId, entityType ? { entityType } : {});
    const now = new Date();
    return docs.map((d) => this.toProfileDTO(d, now));
  },

  /**
   * Sync retention + confidence + mastery after a completed revision. This is the
   * single automatic entry point wired into revision completion.
   */
  async syncAfterRevision(userId: string, session: RevisionSessionDTO): Promise<RetentionProfileDTO> {
    const now = new Date();
    const topicId = await resolveTopicId(session.entityType, session.entityId);
    const profile = await this.ensureProfile(userId, {
      entityType: session.entityType,
      entityId: session.entityId,
      title: session.title,
      topicId,
    });

    const prevConfidence = profile.confidenceScore;
    const prevLevel = profile.currentLevel;

    const newConfidence = confidenceService.boostAfterReview(profile.confidenceScore, session.selfConfidenceAfter);
    const reviewCount = profile.reviewCount + 1;
    const successfulReviews = profile.successfulReviews + 1;
    const successRate = successfulReviews / reviewCount;

    const interval = profile.lastReviewDate ? Math.max(0, daysUntil(now, profile.lastReviewDate)) : 0;
    const averageReviewInterval =
      profile.reviewCount > 0
        ? round((profile.averageReviewInterval * profile.reviewCount + interval) / reviewCount)
        : interval;

    let nextReviewDate = profile.nextReviewDate;
    if (session.revisionScheduleId) {
      const sched = await revisionScheduleRepository.findById(session.revisionScheduleId);
      if (sched) nextReviewDate = sched.nextReviewDate;
    }

    const retentionScore = computeRetention(newConfidence, successRate, 0);
    const level = deriveLevel(retentionScore, nextReviewDate, now);
    const decayScore = getDecayStrategy(profile.strategy).dailyRate(reviewCount);
    const history = pushSnapshot(profile.history, {
      confidenceScore: newConfidence,
      retentionScore,
      level,
      reason: 'Reviewed',
      date: now,
    });

    const updated = await retentionRepository.updateById(profile.id, {
      confidenceScore: newConfidence,
      retentionScore,
      decayScore,
      currentLevel: level,
      reviewCount,
      successfulReviews,
      averageReviewInterval,
      overdueReviews: 0,
      lastReviewDate: session.completedAt ? new Date(session.completedAt) : now,
      nextReviewDate,
      lastDecayDate: now,
      title: session.title,
      topicId: topicId ? new Types.ObjectId(topicId) : profile.topicId,
      history,
    });

    // Mastery synchronization — reuse Module 1's engine (confidence metric).
    if (topicId) {
      try {
        await topicProgressService.applyUpdate(userId, topicId, { confidence: newConfidence });
      } catch (err) {
        logger.warn('Mastery sync from retention skipped (topic locked?)', err);
      }
    }

    await this.recordActivity(userId, updated!, 'retention-updated', `Retention updated: ${updated!.title}`, `Retention ${retentionScore}%, confidence ${newConfidence}%.`);
    if (newConfidence > prevConfidence) {
      await this.recordActivity(userId, updated!, 'confidence-increased', `Confidence up on ${updated!.title}`, `${prevConfidence}% → ${newConfidence}%.`);
    }
    if (LEVEL_RANK[level] > LEVEL_RANK[prevLevel] && (level === 'Strong' || level === 'Mastered')) {
      await this.recordActivity(userId, updated!, 'knowledge-strengthened', `Strengthened ${updated!.title}`, `Now ${level}.`);
    }

    return this.toProfileDTO(updated!, now);
  },

  /**
   * Background pass: apply decay to every profile, flag overdue/at-risk, and log
   * fading confidence. Idempotent per day (skips profiles decayed < 1 day ago).
   */
  async applyDecayForAll(userId: string): Promise<{ processed: number; changed: number }> {
    const now = new Date();
    const profiles = await retentionRepository.findAll(userId);
    let changed = 0;

    for (const p of profiles) {
      const since = p.lastDecayDate ?? p.lastReviewDate ?? p.createdAt;
      const decay = getDecayStrategy(p.strategy).applyDecay({
        confidenceScore: p.confidenceScore,
        reviewCount: p.reviewCount,
        sinceDate: since,
        now,
      });
      if (decay.daysDecayed < 1) continue;

      const prevConfidence = p.confidenceScore;
      const prevLevel = p.currentLevel;
      const newConfidence = decay.confidenceScore;
      const daysOverdue = p.nextReviewDate ? Math.max(0, daysUntil(now, p.nextReviewDate)) : 0;
      const missedReviews = p.missedReviews + (daysOverdue > 0 ? 1 : 0);
      const successRate = p.reviewCount ? p.successfulReviews / p.reviewCount : 0;
      const retentionScore = computeRetention(newConfidence, successRate, daysOverdue);
      const level = deriveLevel(retentionScore, p.nextReviewDate, now);
      const snapshotChanged = newConfidence !== prevConfidence || level !== prevLevel;

      const updated = await retentionRepository.updateById(p.id, {
        confidenceScore: newConfidence,
        retentionScore,
        decayScore: decay.decayScore,
        currentLevel: level,
        missedReviews,
        overdueReviews: daysOverdue,
        lastDecayDate: now,
        history: snapshotChanged
          ? pushSnapshot(p.history, { confidenceScore: newConfidence, retentionScore, level, reason: 'Decay', date: now })
          : p.history,
      });

      if (snapshotChanged) changed += 1;
      if (newConfidence < prevConfidence - 1) {
        await this.recordActivity(userId, updated!, 'confidence-decreased', `Confidence fading on ${updated!.title}`, `${prevConfidence}% → ${newConfidence}%.`);
      }
      if (level === 'At Risk' && prevLevel !== 'At Risk') {
        await this.recordActivity(userId, updated!, 'knowledge-at-risk', `${updated!.title} is at risk`, 'Revise soon to protect retention.');
      }
    }

    return { processed: profiles.length, changed };
  },

  async update(userId: string, entityId: string, patch: { confidenceScore?: number }): Promise<RetentionProfileDTO> {
    const profile = await retentionRepository.findByEntity(userId, entityId);
    if (!profile) throw ApiError.notFound(`Retention profile for '${entityId}' not found`);

    const now = new Date();
    const newConfidence = patch.confidenceScore ?? profile.confidenceScore;
    const successRate = profile.reviewCount ? profile.successfulReviews / profile.reviewCount : 0;
    const daysOverdue = profile.nextReviewDate ? Math.max(0, daysUntil(now, profile.nextReviewDate)) : 0;
    const retentionScore = computeRetention(newConfidence, successRate, daysOverdue);
    const level = deriveLevel(retentionScore, profile.nextReviewDate, now);

    const updated = await retentionRepository.updateById(profile.id, {
      confidenceScore: newConfidence,
      retentionScore,
      currentLevel: level,
      history: pushSnapshot(profile.history, { confidenceScore: newConfidence, retentionScore, level, reason: 'Manual', date: now }),
    });
    return this.toProfileDTO(updated!, now);
  },

  async overview(userId: string): Promise<RetentionOverviewDTO> {
    const now = new Date();
    const profiles = await retentionRepository.findAll(userId);
    const dtos = profiles.map((p) => this.toProfileDTO(p, now));
    const byLevel = (level: RetentionLevel) => dtos.filter((d) => d.currentLevel === level).length;

    const totalReviews = profiles.reduce((s, p) => s + p.reviewCount, 0);
    const totalSuccess = profiles.reduce((s, p) => s + p.successfulReviews, 0);

    return {
      totalProfiles: dtos.length,
      averageConfidence: round(avg(dtos.map((d) => d.confidenceScore))),
      averageRetention: round(avg(dtos.map((d) => d.retentionScore))),
      masteredCount: byLevel('Mastered'),
      strongCount: byLevel('Strong'),
      familiarCount: byLevel('Familiar'),
      learningCount: byLevel('Learning'),
      needsReviewCount: byLevel('Needs Review'),
      atRiskCount: byLevel('At Risk'),
      overdueReviews: dtos.filter((d) => d.isOverdue).length,
      revisionSuccessRate: totalReviews ? round((totalSuccess / totalReviews) * 100) : 0,
      confidenceTrend: aggregateTrend(profiles, now),
      atRisk: dtos
        .filter((d) => d.currentLevel === 'At Risk' || d.currentLevel === 'Needs Review')
        .sort((a, b) => a.retentionScore - b.retentionScore)
        .slice(0, 8)
        .map(toRef),
    };
  },

  async confidence(userId: string): Promise<ConfidenceOverviewDTO> {
    const now = new Date();
    const profiles = await retentionRepository.findAll(userId);
    const entries = profiles.map((p) => ({
      entityType: p.entityType,
      entityId: p.entityId,
      title: p.title,
      confidenceScore: p.confidenceScore,
      trend: confidenceService.trend(p.history).direction,
      currentLevel: deriveLevel(p.retentionScore, p.nextReviewDate, now),
    }));
    return {
      averageConfidence: entries.length ? round(avg(entries.map((e) => e.confidenceScore))) : 0,
      trend: aggregateTrend(profiles, now),
      entries,
    };
  },

  async history(userId: string, limit = 40): Promise<RetentionHistoryRowDTO[]> {
    const profiles = await retentionRepository.findAll(userId);
    const rows: RetentionHistoryRowDTO[] = [];
    for (const p of profiles) {
      for (const s of p.history) {
        rows.push({ entityType: p.entityType, entityId: p.entityId, title: p.title, snapshot: toSnapshotDTO(s) });
      }
    }
    rows.sort((a, b) => b.snapshot.date.localeCompare(a.snapshot.date));
    return rows.slice(0, limit);
  },

  async getDashboardSummary(userId: string): Promise<DashboardRetentionDTO> {
    const ov = await this.overview(userId);
    return {
      averageConfidence: ov.averageConfidence,
      averageRetention: ov.averageRetention,
      atRiskCount: ov.atRiskCount,
      needsReviewCount: ov.needsReviewCount,
      masteredCount: ov.masteredCount,
      overdueReviews: ov.overdueReviews,
      revisionSuccessRate: ov.revisionSuccessRate,
      trendDirection: ov.confidenceTrend.direction,
      trendDelta: ov.confidenceTrend.delta,
    };
  },

  toProfileDTO(doc: RetentionProfileDocument, now: Date): RetentionProfileDTO {
    const successRate = doc.reviewCount ? round((doc.successfulReviews / doc.reviewCount) * 100) : 0;
    const daysUntilReview = doc.nextReviewDate ? daysUntil(doc.nextReviewDate, now) : null;
    const isOverdue = doc.nextReviewDate ? now.getTime() > doc.nextReviewDate.getTime() : false;
    return {
      id: String(doc._id),
      entityType: doc.entityType,
      entityId: doc.entityId,
      title: doc.title,
      topicId: doc.topicId ? String(doc.topicId) : null,
      confidenceScore: doc.confidenceScore,
      retentionScore: doc.retentionScore,
      decayScore: doc.decayScore,
      currentLevel: deriveLevel(doc.retentionScore, doc.nextReviewDate, now),
      reviewCount: doc.reviewCount,
      successfulReviews: doc.successfulReviews,
      missedReviews: doc.missedReviews,
      overdueReviews: doc.overdueReviews,
      averageReviewInterval: doc.averageReviewInterval,
      successRate,
      lastReviewDate: doc.lastReviewDate ? doc.lastReviewDate.toISOString() : null,
      nextReviewDate: doc.nextReviewDate ? doc.nextReviewDate.toISOString() : null,
      daysUntilReview,
      isOverdue,
      strategy: doc.strategy,
      confidenceTrend: confidenceService.trend(doc.history),
      history: doc.history.map(toSnapshotDTO),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  },

  async recordActivity(
    userId: string,
    doc: RetentionProfileDocument,
    type: ActivityType,
    title: string,
    description: string,
  ): Promise<void> {
    await activityService.record(userId, {
      type,
      entityType: doc.entityType === 'topic' ? 'topic' : 'revision',
      entityId: doc.entityId,
      title,
      description,
    });
  },
};

/* ------------------------------- helpers -------------------------------- */

/** Weighted retention score with an overdue penalty. */
function computeRetention(confidence: number, successRate: number, daysOverdue: number): number {
  const base = RETENTION_WEIGHTS.confidence * confidence + RETENTION_WEIGHTS.success * successRate * 100;
  const penalty = Math.min(30, daysOverdue * 3);
  return round(clamp(base - penalty));
}

/** Dynamically derive the retention level from score + review timing. */
function deriveLevel(retentionScore: number, nextReviewDate: Date | null, now: Date): RetentionLevel {
  const daysOverdue = nextReviewDate ? Math.max(0, daysUntil(now, nextReviewDate)) : 0;
  const T = RETENTION_LEVEL_THRESHOLDS;
  if (retentionScore < T.atRisk || daysOverdue > AT_RISK_OVERDUE_DAYS) return 'At Risk';
  if (daysOverdue > 0) return 'Needs Review';
  if (retentionScore >= T.mastered) return 'Mastered';
  if (retentionScore >= T.strong) return 'Strong';
  if (retentionScore >= T.familiar) return 'Familiar';
  return 'Learning';
}

function pushSnapshot(history: IRetentionSnapshot[], snap: IRetentionSnapshot): IRetentionSnapshot[] {
  return [...history, snap].slice(-RETENTION_HISTORY_LIMIT);
}

function toSnapshotDTO(s: IRetentionSnapshot): RetentionSnapshotDTO {
  return {
    confidenceScore: s.confidenceScore,
    retentionScore: s.retentionScore,
    level: s.level,
    reason: s.reason,
    date: new Date(s.date).toISOString(),
  };
}

function toRef(d: RetentionProfileDTO): RetentionProfileRefDTO {
  return {
    entityType: d.entityType,
    entityId: d.entityId,
    title: d.title,
    topicId: d.topicId,
    confidenceScore: d.confidenceScore,
    retentionScore: d.retentionScore,
    currentLevel: d.currentLevel,
  };
}

/** Global daily-average confidence series across all profiles (dashboard trend). */
function aggregateTrend(profiles: RetentionProfileDocument[], _now: Date): ConfidenceTrendDTO {
  const byDay = new Map<string, { sum: number; n: number }>();
  for (const p of profiles) {
    for (const s of p.history) {
      const k = dayKey(new Date(s.date));
      const e = byDay.get(k) ?? { sum: 0, n: 0 };
      e.sum += s.confidenceScore;
      e.n += 1;
      byDay.set(k, e);
    }
  }
  const series = [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([date, e]) => ({ date, value: round(e.sum / e.n) }));
  if (series.length < 2) return { direction: 'stable', delta: 0, series };
  const delta = series[series.length - 1].value - series[0].value;
  const direction =
    delta > CONFIDENCE_CONFIG.trendDelta ? 'rising' : delta < -CONFIDENCE_CONFIG.trendDelta ? 'falling' : 'stable';
  return { direction, delta: round(delta), series };
}

async function resolveTopicId(entityType: RevisionEntityType, entityId: string): Promise<string | null> {
  if (entityType === 'topic') return entityId;
  if (entityType === 'knowledgeEntry') {
    const nb = await notebookRepository.findById(entityId);
    return nb ? String(nb.topicId) : null;
  }
  return null;
}
