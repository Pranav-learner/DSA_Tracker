import { topicProgressRepository } from '../../repositories/topicProgress.repository.js';
import { topicRepository } from '../../repositories/topic.repository.js';
import { phaseService } from '../../services/phase.service.js';
import { retentionService } from '../../services/retention.service.js';
import { masteryService } from '../../services/mastery.service.js';
import { analyticsRepository } from '../repositories/analytics.repository.js';
import { metricsEngine } from './metricsEngine.js';
import {
  MATRIX_METRIC_MAP,
  PATTERN_STATUS_THRESHOLDS,
  WEAKNESS_THRESHOLDS,
  STRENGTH_THRESHOLDS,
} from '../../config/insights.js';
import type { PatternMatrixDTO, PatternProfileDTO, PatternStatus } from '../dto/intelligence.dto.js';

/**
 * PatternAnalyticsService — builds an intelligence profile per pattern (topic).
 * Pure COMPOSITION: it reuses the mastery metrics (MasteryService), the retention
 * profile (RetentionService) and per-topic problem behaviour (analytics repo),
 * mapping them into the Pattern Confidence Matrix. It owns no mastery/retention
 * math of its own.
 */
export const patternAnalyticsService = {
  async profiles(userId: string): Promise<PatternProfileDTO[]> {
    const progresses = await topicProgressRepository.findByUser(userId);
    const active = progresses.filter((p) => p.status !== 'Not Started');
    if (active.length === 0) return [];

    const topicIds = active.map((p) => String(p.topicId));
    const [topics, phases, retentionProfiles, problemByTopic] = await Promise.all([
      topicRepository.findByIds(topicIds),
      phaseService.list(),
      retentionService.listProfiles(userId, 'topic'),
      analyticsRepository.problemStatsByTopic(userId),
    ]);

    const topicById = new Map(topics.map((t) => [String(t._id), t]));
    const phaseTitleById = new Map(phases.map((ph) => [ph.id, ph.title]));
    const retentionByEntity = new Map(retentionProfiles.map((r) => [r.entityId, r]));

    const profiles = active.map((doc) => {
      const topicId = String(doc.topicId);
      const topic = topicById.get(topicId);
      const metrics = masteryService.metricsOf(doc);
      const retention = retentionByEntity.get(topicId);
      const pstat = problemByTopic.get(topicId);

      const matrix: PatternMatrixDTO = {
        understanding: metrics[MATRIX_METRIC_MAP.understanding],
        recognition: metrics[MATRIX_METRIC_MAP.recognition],
        implementation: metrics[MATRIX_METRIC_MAP.implementation],
        optimization: metrics[MATRIX_METRIC_MAP.optimization],
        contestReadiness: metrics[MATRIX_METRIC_MAP.contestReadiness],
        confidence: metrics[MATRIX_METRIC_MAP.confidence],
        retention: retention?.retentionScore ?? 0,
        overallMastery: masteryService.computeOverall(metrics),
      };

      const solved = pstat?.solved ?? 0;
      const attempted = pstat?.attempted ?? 0;
      const overall = matrix.overallMastery;

      return {
        patternId: topicId,
        title: topic?.title ?? 'Unknown pattern',
        phaseId: topic ? String(topic.phaseId) : '',
        phaseTitle: topic ? (phaseTitleById.get(String(topic.phaseId)) ?? '') : '',
        status: statusOf(overall),
        isWeak: overall < WEAKNESS_THRESHOLDS.lowMastery,
        isStrong: overall >= STRENGTH_THRESHOLDS.strongMastery,
        matrix,
        attemptSuccessRate: metricsEngine.successRate(solved, attempted),
        averageSolveTimeMinutes: solved > 0 ? metricsEngine.round((pstat?.solvedTime ?? 0) / solved) : 0,
        revisionSuccessRate: retention?.successRate ?? 0,
        hintDependency: solved > 0 ? metricsEngine.percentage(pstat?.solvedWithHint ?? 0, solved) : 0,
        editorialDependency: solved > 0 ? metricsEngine.percentage(pstat?.solvedWithEditorial ?? 0, solved) : 0,
        problemsSolved: solved,
        problemsAttempted: attempted,
        reviewCount: retention?.reviewCount ?? 0,
        confidenceTrendDirection: retention?.confidenceTrend.direction ?? 'stable',
        confidenceTrendDelta: retention?.confidenceTrend.delta ?? 0,
        overall,
        updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
      } satisfies PatternProfileDTO;
    });

    // Weakest first — the most actionable ordering for the dashboard.
    return profiles.sort((a, b) => a.overall - b.overall);
  },

  async getById(userId: string, patternId: string): Promise<PatternProfileDTO | null> {
    const all = await this.profiles(userId);
    return all.find((p) => p.patternId === patternId) ?? null;
  },
};

function statusOf(overall: number): PatternStatus {
  if (overall >= PATTERN_STATUS_THRESHOLDS.strong) return 'strong';
  if (overall >= PATTERN_STATUS_THRESHOLDS.developing) return 'developing';
  return 'needs-work';
}
