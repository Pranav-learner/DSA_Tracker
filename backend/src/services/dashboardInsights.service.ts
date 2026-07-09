import {
  HEALTH_STATUS_THRESHOLDS,
  HEALTH_WEIGHTS,
  REVISION_HEALTH,
  RETENTION_HEALTH,
} from '../config/health.js';
import type { OverallProgressDTO, RecommendationDTO } from './learning.dto.js';
import type { KnowledgeStatsDTO } from './notebook.dto.js';
import type { TopicSummaryDTO } from './mappers.js';
import type { DashboardRevisionQueueDTO } from './revision.dto.js';
import type { DashboardRetentionDTO } from './retention.dto.js';
import type {
  DashboardHealthDTO,
  DashboardKnowledgeDTO,
  DashboardTodayPlanDTO,
  HealthIndicatorDTO,
  HealthStatus,
  PlanPriority,
  QuickActionDTO,
} from './dashboard.dto.js';

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const round = (n: number) => Math.round(n);

function statusOf(score: number): HealthStatus {
  if (score >= HEALTH_STATUS_THRESHOLDS.excellent) return 'excellent';
  if (score >= HEALTH_STATUS_THRESHOLDS.good) return 'good';
  if (score >= HEALTH_STATUS_THRESHOLDS.fair) return 'fair';
  return 'at-risk';
}

/**
 * DashboardInsightsService — the DERIVATION layer for the Learning-OS dashboard.
 *
 * Pure functions over already-computed engine summaries: it turns Learning +
 * Knowledge + Revision + Retention outputs into the Knowledge Summary, Today's
 * Plan, Learning Health panel and Quick Actions. It owns the small composite
 * rules (health scoring, plan priority) that don't belong in any single engine —
 * keeping the aggregation service pure orchestration and the frontend free of
 * business logic. All thresholds/weights come from `config/health.ts`.
 */
export const dashboardInsightsService = {
  /** Knowledge-base coverage rollup (Module 2). */
  buildKnowledge(stats: KnowledgeStatsDTO, topicsTotal: number): DashboardKnowledgeDTO {
    const coverage = topicsTotal > 0 ? clamp((stats.topicsCovered / topicsTotal) * 100) : 0;
    return {
      knowledgeEntries: stats.knowledgeEntries,
      representativeProblems: stats.representativeProblems,
      patternsLearned: stats.patternsLearned,
      patternsPending: Math.max(0, topicsTotal - stats.topicsCovered),
      topicsCovered: stats.topicsCovered,
      notebookCoveragePercent: round(coverage),
    };
  },

  /** Composite Learning Health panel across the four engines. */
  buildHealth(input: {
    overall: OverallProgressDTO;
    knowledge: DashboardKnowledgeDTO;
    revisionQueue: DashboardRevisionQueueDTO;
    retention: DashboardRetentionDTO;
  }): DashboardHealthDTO {
    const { overall, knowledge, revisionQueue, retention } = input;

    // Learning — how far mastery has progressed overall.
    const learning = clamp(overall.overallMastery);

    // Knowledge — how much of the roadmap has been documented.
    const knowledgeScore = clamp(knowledge.notebookCoveragePercent);

    // Revision — on-track unless reviews pile up overdue.
    const revision =
      revisionQueue.totalScheduled === 0
        ? 100
        : clamp(
            100 -
              Math.min(
                revisionQueue.overdueCount * REVISION_HEALTH.overduePenaltyPerReview,
                REVISION_HEALTH.maxOverduePenalty,
              ),
          );

    // Retention — average retention, penalised by at-risk knowledge.
    const hasRetentionData =
      retention.averageRetention > 0 ||
      retention.masteredCount > 0 ||
      retention.needsReviewCount > 0 ||
      retention.atRiskCount > 0 ||
      retention.overdueReviews > 0;
    const retentionScore = !hasRetentionData
      ? 100
      : clamp(
          retention.averageRetention -
            Math.min(
              retention.atRiskCount * RETENTION_HEALTH.atRiskPenaltyPerEntity,
              RETENTION_HEALTH.maxAtRiskPenalty,
            ),
        );

    const indicators: HealthIndicatorDTO[] = [
      {
        key: 'learning',
        label: 'Learning',
        score: round(learning),
        status: statusOf(learning),
        detail: `${round(overall.overallMastery)}% overall mastery`,
      },
      {
        key: 'knowledge',
        label: 'Knowledge',
        score: round(knowledgeScore),
        status: statusOf(knowledgeScore),
        detail: `${knowledge.topicsCovered} topics documented`,
      },
      {
        key: 'revision',
        label: 'Revision',
        score: round(revision),
        status: statusOf(revision),
        detail: revisionQueue.overdueCount > 0 ? `${revisionQueue.overdueCount} overdue` : 'On track',
      },
      {
        key: 'retention',
        label: 'Retention',
        score: round(retentionScore),
        status: statusOf(retentionScore),
        detail: retention.atRiskCount > 0 ? `${retention.atRiskCount} at risk` : `${retention.averageRetention}% avg retention`,
      },
    ];

    const overallScore = round(
      learning * HEALTH_WEIGHTS.learning +
        knowledgeScore * HEALTH_WEIGHTS.knowledge +
        revision * HEALTH_WEIGHTS.revision +
        retentionScore * HEALTH_WEIGHTS.retention,
    );

    return {
      overallScore,
      overallStatus: statusOf(overallScore),
      indicators,
      confidence: retention.averageConfidence,
      topicsAtRisk: retention.atRiskCount,
      masteredTopics: retention.masteredCount,
      upcomingReviews: revisionQueue.upcomingCount,
    };
  },

  /** Today's prioritised plan — what to study + revise right now. */
  buildTodayPlan(input: {
    recommendation: RecommendationDTO;
    currentTopic: TopicSummaryDTO | null;
    currentMastery: number;
    revisionQueue: DashboardRevisionQueueDTO;
  }): DashboardTodayPlanDTO {
    const { recommendation, currentTopic, currentMastery, revisionQueue } = input;
    const revisionsDue = revisionQueue.dueTodayCount + revisionQueue.overdueCount;

    const estimatedStudyMinutes = currentTopic
      ? round(currentTopic.estimatedHours * 60 * (1 - clamp(currentMastery) / 100))
      : 0;

    const priority: PlanPriority =
      revisionQueue.overdueCount > 0 || recommendation.type === 'complete-assessment'
        ? 'high'
        : revisionsDue > 0 ||
            recommendation.type === 'continue-topic' ||
            recommendation.type === 'next-topic'
          ? 'medium'
          : 'low';

    const headline =
      revisionQueue.overdueCount > 0
        ? `Catch up on ${revisionQueue.overdueCount} overdue review${revisionQueue.overdueCount === 1 ? '' : 's'}, then ${recommendation.actionLabel.toLowerCase()}`
        : recommendation.title;

    return {
      recommendation,
      currentTopic,
      revisionsDue,
      estimatedStudyMinutes,
      estimatedRevisionMinutes: revisionQueue.estimatedReviewMinutes,
      priority,
      headline,
    };
  },

  /** One-tap actions, each pointing at an existing route (disabled when N/A). */
  buildQuickActions(input: {
    recommendation: RecommendationDTO;
    currentTopicId: string | null;
    hasActiveSession: boolean;
    revisionsDue: number;
  }): QuickActionDTO[] {
    const { recommendation, currentTopicId, hasActiveSession, revisionsDue } = input;
    return [
      {
        kind: 'continue-learning',
        label: recommendation.actionLabel,
        to: recommendation.actionTo,
        enabled: true,
        primary: true,
      },
      {
        kind: 'resume-session',
        label: 'Resume Session',
        to: '/revision/session',
        enabled: hasActiveSession,
        primary: false,
      },
      {
        kind: 'start-revision',
        label: "Start Today's Revision",
        to: '/revision',
        enabled: revisionsDue > 0,
        primary: false,
      },
      {
        kind: 'open-topic',
        label: 'Open Current Topic',
        to: currentTopicId ? `/topic/${currentTopicId}` : '/roadmap',
        enabled: Boolean(currentTopicId),
        primary: false,
      },
      {
        kind: 'view-notebook',
        label: 'View Notebook',
        to: '/notebook',
        enabled: true,
        primary: false,
      },
      {
        kind: 'view-calendar',
        label: 'Revision Calendar',
        to: '/revision',
        enabled: true,
        primary: false,
      },
      {
        kind: 'view-retention',
        label: 'Knowledge Retention',
        to: '/retention',
        enabled: true,
        primary: false,
      },
    ];
  },
};
