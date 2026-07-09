import { analyticsAggregationService } from './analyticsAggregation.service.js';
import { patternAnalyticsService } from './patternAnalytics.service.js';
import { weaknessDetectionService } from './weaknessDetection.service.js';
import { strengthDetectionService } from './strengthDetection.service.js';
import { trendAnalysisService } from './trendAnalysis.service.js';
import { insightEngine } from './insightEngine.js';
import { analyticsRecommendationService } from './analyticsRecommendation.service.js';
import type { AnalyticsWindow } from '../types/analytics.types.js';
import type {
  AnalyticsRecommendationDTO,
  InsightDTO,
  PatternIntelligenceOverviewDTO,
  PatternProfileDTO,
  StrengthDTO,
  TrendDTO,
  WeaknessDTO,
} from '../dto/intelligence.dto.js';

/**
 * PatternIntelligenceService — the single entry point for every intelligence
 * endpoint. Orchestrates the rule-based engines, shares one set of pattern
 * profiles per request (no duplicated aggregation), and caches each scope via
 * the analytics cache (TTL + activity-token invalidation). No AI.
 */
export const patternIntelligenceService = {
  patterns(userId: string, window: AnalyticsWindow): Promise<PatternProfileDTO[]> {
    return analyticsAggregationService.section(userId, window, 'patterns', () => patternAnalyticsService.profiles(userId));
  },

  pattern(userId: string, patternId: string): Promise<PatternProfileDTO | null> {
    return patternAnalyticsService.getById(userId, patternId);
  },

  weaknesses(userId: string, window: AnalyticsWindow): Promise<WeaknessDTO[]> {
    return analyticsAggregationService.section(userId, window, 'weaknesses', () => weaknessDetectionService.detect(userId));
  },

  strengths(userId: string, window: AnalyticsWindow): Promise<StrengthDTO[]> {
    return analyticsAggregationService.section(userId, window, 'strengths', () => strengthDetectionService.detect(userId));
  },

  trends(userId: string, window: AnalyticsWindow): Promise<TrendDTO[]> {
    return analyticsAggregationService.section(userId, window, 'trends', () => trendAnalysisService.analyze(userId, window));
  },

  insights(userId: string, window: AnalyticsWindow): Promise<InsightDTO[]> {
    return analyticsAggregationService.section(userId, window, 'insights', () => insightEngine.generate(userId, window));
  },

  recommendations(userId: string, window: AnalyticsWindow): Promise<AnalyticsRecommendationDTO[]> {
    return analyticsAggregationService.section(userId, window, 'recommendations', () =>
      analyticsRecommendationService.generate(userId),
    );
  },

  /** Everything in one payload — profiles computed once and shared downstream. */
  overview(userId: string, window: AnalyticsWindow): Promise<PatternIntelligenceOverviewDTO> {
    return analyticsAggregationService.section(userId, window, 'intelligence-overview', async () => {
      const profiles = await patternAnalyticsService.profiles(userId);
      const [weaknesses, strengths, trends] = await Promise.all([
        weaknessDetectionService.detect(userId, profiles),
        strengthDetectionService.detect(userId, profiles),
        trendAnalysisService.analyze(userId, window),
      ]);
      const [insights, recommendations] = await Promise.all([
        insightEngine.generate(userId, window, { profiles, weaknesses, strengths, trends }),
        analyticsRecommendationService.generate(userId, { profiles, weaknesses }),
      ]);
      return { patterns: profiles, weaknesses, strengths, trends, insights, recommendations };
    });
  },
};
