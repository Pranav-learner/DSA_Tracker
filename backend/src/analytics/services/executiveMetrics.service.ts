import { analyticsAggregationService } from './analyticsAggregation.service.js';
import { patternIntelligenceService } from './patternIntelligence.service.js';
import { insightEngine } from './insightEngine.js';
import { analyticsRecommendationService } from './analyticsRecommendation.service.js';
import { metricsEngine } from './metricsEngine.js';
import { progressService } from '../../services/progress.service.js';
import { phaseService } from '../../services/phase.service.js';
import { topicRepository } from '../../repositories/topic.repository.js';
import {
  EXECUTIVE_SCORE_WEIGHTS,
  OVERALL_READINESS_WEIGHTS,
  EXECUTIVE_NORMALISERS,
  SCORE_STATUS_THRESHOLDS,
} from '../../config/executive.js';
import type { AnalyticsWindow } from '../types/analytics.types.js';
import type { ExecutiveDTO, ExecutiveScoresDTO, ScoreStatus } from '../dto/executive.dto.js';

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const norm = (v: number, max: number) => clamp((v / max) * 100);

/** Weighted blend of named parts against a matching weight map (parts 0–100). */
function weighted(parts: Record<string, number>, weights: Record<string, number>): number {
  return metricsEngine.weightedAverage(Object.keys(weights).map((k) => ({ value: parts[k] ?? 0, weight: weights[k] })));
}

function statusOf(score: number): ScoreStatus {
  if (score >= SCORE_STATUS_THRESHOLDS.excellent) return 'excellent';
  if (score >= SCORE_STATUS_THRESHOLDS.good) return 'good';
  if (score >= SCORE_STATUS_THRESHOLDS.fair) return 'fair';
  return 'at-risk';
}

/**
 * ExecutiveMetricsService — composite executive scores. Each score is a WEIGHTED
 * BLEND of existing analytics metrics (configurable weights in config/executive.ts);
 * it introduces no new aggregation. Reuses the analytics overview + pattern
 * intelligence + insight/recommendation engines.
 */
export const executiveMetricsService = {
  computeScores(overview: Awaited<ReturnType<typeof analyticsAggregationService.overview>>): ExecutiveScoresDTO {
    const W = EXECUTIVE_SCORE_WEIGHTS;
    const N = EXECUTIVE_NORMALISERS;
    const L = overview.learning;
    const K = overview.knowledge;
    const R = overview.retention;
    const V = overview.revision;
    const A = overview.activity;

    const velocity = norm(L.learningVelocityPerWeek, N.velocityPerWeekMax);
    const reviewCompletion = V.totalScheduled > 0 ? metricsEngine.percentage(V.reviewsCompleted, V.totalScheduled) : V.reviewsCompleted > 0 ? 100 : 0;

    const learning = weighted({ completion: L.completionPercent, mastery: L.averageMastery, velocity }, W.learning);
    const knowledge = weighted({ coverage: K.coveragePercent, confidence: K.averageConfidence, documentation: K.documentationRate }, W.knowledge);
    const retention = weighted({ retention: R.averageRetention, health: R.knowledgeHealthPercent }, W.retention);
    const revision = weighted({ consistency: V.revisionConsistencyPercent, completion: reviewCompletion }, W.revision);
    const productivity = weighted(
      { streak: norm(A.currentStreak, N.streakDaysMax), activeDays: norm(A.activeDays, N.activeDaysMax), velocity },
      W.productivity,
    );

    const overallReadiness = weighted({ learning, knowledge, retention, revision, productivity }, OVERALL_READINESS_WEIGHTS);

    return {
      learning: metricsEngine.round(learning),
      knowledge: metricsEngine.round(knowledge),
      retention: metricsEngine.round(retention),
      revision: metricsEngine.round(revision),
      productivity: metricsEngine.round(productivity),
      overallReadiness: metricsEngine.round(overallReadiness),
    };
  },

  async compute(userId: string, window: AnalyticsWindow): Promise<ExecutiveDTO> {
    const [overview, patterns, progress] = await Promise.all([
      analyticsAggregationService.overview(userId, window),
      patternIntelligenceService.patterns(userId, window),
      progressService.getOverview(userId),
    ]);

    const scores = this.computeScores(overview);

    // Resolve current phase/topic labels (reuse existing services).
    let currentPhase: ExecutiveDTO['currentPhase'] = null;
    if (progress.currentPhaseId) {
      const phases = await phaseService.list();
      const ph = phases.find((p) => p.id === progress.currentPhaseId);
      const slice = overview.learning.phaseProgress.find((p) => p.phaseId === progress.currentPhaseId);
      if (ph) currentPhase = { id: ph.id, title: ph.title, completionPercent: slice?.completionPercent ?? 0 };
    }
    let currentTopic: ExecutiveDTO['currentTopic'] = null;
    if (progress.currentTopicId) {
      const topic = await topicRepository.findById(progress.currentTopicId);
      if (topic) currentTopic = { id: String(topic._id), title: topic.title };
    }

    const [insights, recommendations] = await Promise.all([
      insightEngine.generate(userId, window),
      analyticsRecommendationService.generate(userId),
    ]);

    return {
      scores,
      breakdown: [
        { key: 'learning', label: 'Learning', score: scores.learning, status: statusOf(scores.learning) },
        { key: 'knowledge', label: 'Knowledge', score: scores.knowledge, status: statusOf(scores.knowledge) },
        { key: 'retention', label: 'Retention', score: scores.retention, status: statusOf(scores.retention) },
        { key: 'revision', label: 'Revision', score: scores.revision, status: statusOf(scores.revision) },
        { key: 'productivity', label: 'Productivity', score: scores.productivity, status: statusOf(scores.productivity) },
      ],
      progress: {
        completionPercent: overview.learning.completionPercent,
        overallMastery: overview.learning.averageMastery,
        averageRetention: overview.retention.averageRetention,
        learningVelocityPerWeek: overview.learning.learningVelocityPerWeek,
        knowledgeCoveragePercent: overview.knowledge.coveragePercent,
        revisionConsistencyPercent: overview.revision.revisionConsistencyPercent,
      },
      currentPhase,
      currentTopic,
      patternHealth: {
        strong: patterns.filter((p) => p.status === 'strong').length,
        developing: patterns.filter((p) => p.status === 'developing').length,
        needsWork: patterns.filter((p) => p.status === 'needs-work').length,
        total: patterns.length,
      },
      insights: insights.slice(0, 6),
      recommendations: recommendations.slice(0, 6),
    };
  },
};
