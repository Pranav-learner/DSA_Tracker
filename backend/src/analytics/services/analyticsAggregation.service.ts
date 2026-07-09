import { progressService } from '../../services/progress.service.js';
import { analyticsRepository } from '../repositories/analytics.repository.js';
import { analyticsCacheService } from './analyticsCache.service.js';
import { learningAnalyticsService } from './learningAnalytics.service.js';
import { problemAnalyticsService } from './problemAnalytics.service.js';
import { knowledgeAnalyticsService } from './knowledgeAnalytics.service.js';
import { revisionAnalyticsService } from './revisionAnalytics.service.js';
import { retentionAnalyticsService } from './retentionAnalytics.service.js';
import { activityAnalyticsService } from './activityAnalytics.service.js';
import { ANALYTICS_CACHE_TTL } from '../../config/analytics.js';
import type { AnalyticsContext, AnalyticsWindow } from '../types/analytics.types.js';
import type {
  ActivitySummaryDTO,
  AnalyticsOverviewDTO,
  KnowledgeSummaryDTO,
  LearningSummaryDTO,
  ProblemSummaryDTO,
  RetentionSummaryDTO,
  RevisionSummaryDTO,
} from '../dto/analytics.dto.js';

/** Stable cache key for a window (range label or custom day-span), not the exact instant. */
function windowKey(window: AnalyticsWindow): string {
  if (window.label !== 'custom') return window.label;
  const from = window.from ? window.from.toISOString().slice(0, 10) : 'all';
  return `${from}_${window.to.toISOString().slice(0, 10)}`;
}

/**
 * AnalyticsAggregationService — the single entry point every analytics consumer
 * uses. It NEVER queries modules from a controller; it orchestrates the six
 * analytics services, shares one learning overview per request (avoiding N+1),
 * and caches each result keyed by user + scope + window + freshness token.
 *
 * The freshness token is the user's latest Activity timestamp, so any mutation
 * that records activity (solve, review, knowledge/mastery change) invalidates
 * the cache automatically — no completed module is touched.
 */
export const analyticsAggregationService = {
  /** Per-user cache-busting token (latest activity time). */
  freshnessToken(userId: string): Promise<number> {
    return analyticsRepository.latestActivityAt(userId);
  },

  async overview(userId: string, window: AnalyticsWindow): Promise<AnalyticsOverviewDTO> {
    const token = await this.freshnessToken(userId);
    return analyticsCacheService.wrap(
      `${userId}:overview:${windowKey(window)}`,
      ANALYTICS_CACHE_TTL.overview,
      token,
      async () => {
        const ctx: AnalyticsContext = { overview: await progressService.getOverview(userId) };
        const [learning, problems, knowledge, revision, retention, activity] = await Promise.all([
          learningAnalyticsService.summary(userId, window, ctx),
          problemAnalyticsService.summary(userId, window),
          knowledgeAnalyticsService.summary(userId, window, ctx),
          revisionAnalyticsService.summary(userId, window),
          retentionAnalyticsService.summary(userId, window),
          activityAnalyticsService.summary(userId, window),
        ]);
        return { learning, problems, knowledge, revision, retention, activity };
      },
    );
  },

  learning(userId: string, window: AnalyticsWindow): Promise<LearningSummaryDTO> {
    return this.section(userId, window, 'learning', () => learningAnalyticsService.summary(userId, window));
  },
  problems(userId: string, window: AnalyticsWindow): Promise<ProblemSummaryDTO> {
    return this.section(userId, window, 'problems', () => problemAnalyticsService.summary(userId, window));
  },
  knowledge(userId: string, window: AnalyticsWindow): Promise<KnowledgeSummaryDTO> {
    return this.section(userId, window, 'knowledge', () => knowledgeAnalyticsService.summary(userId, window));
  },
  revision(userId: string, window: AnalyticsWindow): Promise<RevisionSummaryDTO> {
    return this.section(userId, window, 'revision', () => revisionAnalyticsService.summary(userId, window));
  },
  retention(userId: string, window: AnalyticsWindow): Promise<RetentionSummaryDTO> {
    return this.section(userId, window, 'retention', () => retentionAnalyticsService.summary(userId, window));
  },
  activity(userId: string, window: AnalyticsWindow): Promise<ActivitySummaryDTO> {
    return this.section(userId, window, 'activity', () => activityAnalyticsService.summary(userId, window));
  },

  /** Cache wrapper shared by every single-scope endpoint. */
  async section<T>(userId: string, window: AnalyticsWindow, scope: string, producer: () => Promise<T>): Promise<T> {
    const token = await this.freshnessToken(userId);
    return analyticsCacheService.wrap(`${userId}:${scope}:${windowKey(window)}`, ANALYTICS_CACHE_TTL.section, token, producer);
  },

  /** Explicit invalidation hook (used by the refresh job / future events). */
  invalidate(userId: string): void {
    analyticsCacheService.invalidateUser(userId);
  },
};
