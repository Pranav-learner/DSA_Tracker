import { analyticsAggregationService } from '../../analytics/services/analyticsAggregation.service.js';
import { patternIntelligenceService } from '../../analytics/services/patternIntelligence.service.js';
import { ratingAnalyticsService } from './ratingAnalytics.service.js';
import { contestReadinessService } from './contestReadiness.service.js';
import { contestCorrelationService } from './contestCorrelation.service.js';
import { upsolveService } from './upsolve.service.js';
import { COMPETITIVE_INSIGHT_THRESHOLDS, COMPETITIVE_LIMITS } from '../../config/competitive.js';
import type { AnalyticsWindow } from '../../analytics/types/analytics.types.js';
import type { AnalyticsOverviewDTO } from '../../analytics/dto/analytics.dto.js';
import type { WeaknessDTO } from '../../analytics/dto/intelligence.dto.js';
import type {
  CompetitiveInsightDTO,
  CompetitiveRecommendationDTO,
  ContestCorrelationDTO,
  ContestReadinessDTO,
  CompetitiveIntelligenceDTO,
  RatingAnalysisDTO,
} from '../dto/competitive.dto.js';
import type { UpsolveQueueDTO } from '../dto/learning.dto.js';

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;

/** Rule-based competitive insights referencing measurable metrics. */
function buildInsights(correlation: ContestCorrelationDTO, rating: RatingAnalysisDTO, overview: AnalyticsOverviewDTO, weaknesses: WeaknessDTO[]): CompetitiveInsightDTO[] {
  const T = COMPETITIVE_INSIGHT_THRESHOLDS;
  const out: CompetitiveInsightDTO[] = [];

  if (rating.ratingTrend === 'falling') {
    out.push({ id: 'insight:rating-falling', type: 'warning', severity: 'high', title: 'Rating is trending down', reason: `Your rating has moved ${rating.ratingGrowth} over your recent contests.`, suggestedAction: 'Upsolve recent problems and revise weak patterns before the next contest.', relatedTopics: [] });
  } else if (rating.ratingTrend === 'rising') {
    out.push({ id: 'insight:rating-rising', type: 'improvement', severity: 'low', title: 'Rating is climbing', reason: `You've gained ${rating.ratingGrowth} points recently (best jump +${rating.largestGain}).`, suggestedAction: 'Keep the momentum — enter another rated contest.', relatedTopics: [] });
  }

  if (overview.problems.averageSolveTimeMinutes >= T.slowSolveMinutes) {
    out.push({ id: 'insight:slow-solve', type: 'opportunity', severity: 'medium', title: 'Slow implementation is costing rank', reason: `Your average solve time is ${overview.problems.averageSolveTimeMinutes}m — slower solves push rank down.`, suggestedAction: 'Drill implementation speed on easier problems.', relatedTopics: [] });
  }
  if (overview.revision.revisionConsistencyPercent < T.lowRevisionConsistency) {
    out.push({ id: 'insight:low-revision', type: 'warning', severity: 'medium', title: 'Low revision consistency', reason: `Revision consistency is ${overview.revision.revisionConsistencyPercent}% — knowledge fades between contests.`, suggestedAction: 'Clear your revision queue before the next contest.', relatedTopics: [] });
  }
  if (overview.retention.knowledgeHealthPercent >= 75) {
    out.push({ id: 'insight:knowledge-health', type: 'strength', severity: 'low', title: 'Strong knowledge health', reason: `Knowledge health is ${overview.retention.knowledgeHealthPercent}% — a solid base for steady contest performance.`, suggestedAction: 'Lock it in with a virtual contest.', relatedTopics: [] });
  }

  // Diverging correlations → opportunities.
  for (const c of correlation.items.filter((x) => x.direction === 'negative')) {
    out.push({ id: `insight:corr:${c.key}`, type: 'opportunity', severity: 'medium', title: c.label, reason: c.insight, suggestedAction: `Raise ${c.xLabel.toLowerCase()} to lift ${c.yLabel.toLowerCase()}.`, relatedTopics: [] });
  }

  // Weak patterns → focus areas (reuse Pattern Intelligence).
  for (const w of weaknesses.filter((x) => x.severity !== 'low').slice(0, 5)) {
    out.push({ id: `insight:weak:${w.id}`, type: 'focus', severity: w.severity, title: w.title, reason: w.detail, suggestedAction: w.recommendationHint, relatedTopics: w.entityId ? [{ id: w.entityId, title: w.title }] : [] });
  }

  const rank = { high: 0, medium: 1, low: 2 } as const;
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]).slice(0, COMPETITIVE_LIMITS.maxInsights);
}

/** Rule-based, contest-aware recommendations. */
function buildRecommendations(readiness: ContestReadinessDTO, weaknesses: WeaknessDTO[], queue: UpsolveQueueDTO, rating: RatingAnalysisDTO): CompetitiveRecommendationDTO[] {
  const recs: CompetitiveRecommendationDTO[] = [];

  if (queue.counts.pending + queue.counts.inProgress > 0) {
    recs.push({ id: 'rec:upsolve', priority: 'high', title: 'Upsolve pending problems', reason: `${queue.counts.pending + queue.counts.inProgress} unsolved contest problems are waiting.`, suggestedAction: 'Open upsolve queue', actionType: 'upsolve', to: '/upsolve', estimatedTimeMinutes: queue.estimatedRemainingMinutes || 30, learningImpact: 'high' });
  }
  if (readiness.weakAreas.includes('Revision Readiness')) {
    recs.push({ id: 'rec:revise', priority: 'high', title: 'Revise weak patterns', reason: 'Revision readiness is low — clear the queue before your next contest.', suggestedAction: 'Start revision', actionType: 'revise-patterns', to: '/revision', estimatedTimeMinutes: 20, learningImpact: 'high' });
  }
  if (readiness.breakdown.find((b) => b.key === 'implementation')?.status === 'early' || readiness.breakdown.find((b) => b.key === 'implementation')?.status === 'not-ready') {
    recs.push({ id: 'rec:speed', priority: 'medium', title: 'Improve implementation speed', reason: 'Implementation readiness is holding you back on rank.', suggestedAction: 'Practice problems', actionType: 'improve-speed', to: '/problems', estimatedTimeMinutes: 30, learningImpact: 'medium' });
  }
  for (const w of weaknesses.filter((x) => x.severity === 'high' && x.entityId).slice(0, 2)) {
    recs.push({ id: `rec:strengthen:${w.entityId}`, priority: 'medium', title: `Strengthen ${w.title.split(' has ')[0].split(' in ').pop() ?? 'a weak topic'}`, reason: w.detail, suggestedAction: 'Open topic', actionType: 'strengthen-topic', to: `/topic/${w.entityId}`, estimatedTimeMinutes: 45, learningImpact: 'high' });
  }
  if (readiness.overall >= 70) {
    recs.push({ id: 'rec:practice-contest', priority: 'low', title: rating.ratingTrend === 'falling' ? 'Do a virtual contest to rebuild rhythm' : 'Enter a rated contest', reason: `You're ${readiness.status} for contests (${readiness.overall}%).`, suggestedAction: 'Log a contest', actionType: rating.ratingTrend === 'falling' ? 'virtual-contest' : 'practice-contest', to: '/contests/new', estimatedTimeMinutes: 120, learningImpact: 'medium' });
  }

  return recs.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]).slice(0, COMPETITIVE_LIMITS.maxRecommendations);
}

/**
 * CompetitiveIntelligenceService — the capstone orchestrator. It explains WHY
 * contest performance changes by correlating learning behaviour with outcomes.
 * Pure orchestration: it reuses the analytics overview, Pattern Intelligence,
 * rating analysis, readiness and correlation services; it owns no new analytics.
 * Cached via the analytics cache (activity-token invalidation).
 */
export const competitiveIntelligenceService = {
  section<T>(userId: string, window: AnalyticsWindow, scope: string, producer: () => Promise<T>): Promise<T> {
    return analyticsAggregationService.section(userId, window, scope, producer);
  },

  ratingAnalysis(userId: string, window: AnalyticsWindow) {
    return this.section(userId, window, 'competitive-rating', () => ratingAnalyticsService.analyze(userId));
  },
  readiness(userId: string, window: AnalyticsWindow) {
    return this.section(userId, window, 'competitive-readiness', () => contestReadinessService.compute(userId));
  },
  correlation(userId: string, window: AnalyticsWindow) {
    return this.section(userId, window, 'competitive-correlation', () => contestCorrelationService.analyze(userId));
  },

  insights(userId: string, window: AnalyticsWindow): Promise<CompetitiveInsightDTO[]> {
    return this.section(userId, window, 'competitive-insights', async () => {
      const [overview, intel, rating] = await Promise.all([
        analyticsAggregationService.overview(userId, window),
        patternIntelligenceService.overview(userId, window),
        ratingAnalyticsService.analyze(userId),
      ]);
      return buildInsights(contestCorrelationService.build(overview, rating), rating, overview, intel.weaknesses);
    });
  },

  overview(userId: string, window: AnalyticsWindow): Promise<CompetitiveIntelligenceDTO> {
    return this.section(userId, window, 'competitive-intelligence', async () => {
      const [overview, intel, readiness, rating, queue] = await Promise.all([
        analyticsAggregationService.overview(userId, window),
        patternIntelligenceService.overview(userId, window),
        contestReadinessService.compute(userId),
        ratingAnalyticsService.analyze(userId),
        upsolveService.queue(userId),
      ]);
      const correlation = contestCorrelationService.build(overview, rating);
      const insights = buildInsights(correlation, rating, overview, intel.weaknesses);
      const recommendations = buildRecommendations(readiness, intel.weaknesses, queue, rating);

      return {
        summary: {
          headline: `${readiness.status === 'ready' ? 'Contest-ready' : readiness.status === 'developing' ? 'Developing' : 'Building up'} · rating ${rating.ratingTrend}`,
          overallReadiness: readiness.overall,
          readinessStatus: readiness.status,
          currentRating: rating.currentRating,
          ratingTrend: rating.ratingTrend,
          pendingUpsolve: queue.counts.pending + queue.counts.inProgress,
        },
        strengths: intel.strengths,
        weaknesses: intel.weaknesses,
        insights,
        recommendations,
        readiness,
        correlation,
        ratingAnalysis: rating,
      };
    });
  },
};
