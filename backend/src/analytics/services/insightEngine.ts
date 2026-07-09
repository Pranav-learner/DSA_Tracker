import { patternAnalyticsService } from './patternAnalytics.service.js';
import { weaknessDetectionService } from './weaknessDetection.service.js';
import { strengthDetectionService } from './strengthDetection.service.js';
import { trendAnalysisService } from './trendAnalysis.service.js';
import { analyticsAggregationService } from './analyticsAggregation.service.js';
import { INSIGHT_LIMITS } from '../../config/insights.js';
import type { AnalyticsWindow } from '../types/analytics.types.js';
import type { InsightDTO, PatternProfileDTO, StrengthDTO, TrendDTO, WeaknessDTO } from '../dto/intelligence.dto.js';

export interface InsightContext {
  profiles?: PatternProfileDTO[];
  weaknesses?: WeaknessDTO[];
  strengths?: StrengthDTO[];
  trends?: TrendDTO[];
}

/**
 * InsightEngine — turns the rule-based signals (weaknesses, strengths, trends)
 * and progress milestones into a dynamic, human-readable insights feed. Pure
 * composition over the other intelligence services; no AI, no new aggregation.
 */
export const insightEngine = {
  async generate(userId: string, window: AnalyticsWindow, ctx: InsightContext = {}): Promise<InsightDTO[]> {
    const profiles = ctx.profiles ?? (await patternAnalyticsService.profiles(userId));
    const [weaknesses, strengths, trends, overview] = await Promise.all([
      ctx.weaknesses ? Promise.resolve(ctx.weaknesses) : weaknessDetectionService.detect(userId, profiles),
      ctx.strengths ? Promise.resolve(ctx.strengths) : strengthDetectionService.detect(userId, profiles),
      ctx.trends ? Promise.resolve(ctx.trends) : trendAnalysisService.analyze(userId, window),
      analyticsAggregationService.overview(userId, window),
    ]);

    const insights: InsightDTO[] = [];

    // Trend insights (most recent signal of change).
    for (const t of trends) {
      if (t.direction === 'stable') continue;
      const positive = t.direction === 'increasing';
      insights.push({
        id: `trend:${t.key}`,
        type: 'trend',
        tone: positive ? 'positive' : 'negative',
        title: `${t.label} ${positive ? 'is rising' : 'is declining'}`,
        message: `${t.label} moved from ${t.previous}${t.unit} to ${t.current}${t.unit} (${t.delta > 0 ? '+' : ''}${t.delta}${t.unit}).`,
        entityType: 'global',
        entityId: null,
        priority: positive ? 'low' : 'medium',
      });
    }

    // Strength insights (top improving / strong patterns).
    for (const s of strengths.filter((x) => x.category === 'recent-improvement' || x.category === 'strong-topic').slice(0, 5)) {
      insights.push({
        id: `insight-strength:${s.id}`,
        type: 'strength',
        tone: 'positive',
        title: s.title,
        message: s.detail,
        entityType: 'topic',
        entityId: s.entityId,
        priority: 'low',
      });
    }

    // Weakness insights (highest severity first).
    for (const w of weaknesses.filter((x) => x.severity !== 'low').slice(0, 8)) {
      insights.push({
        id: `insight-weakness:${w.id}`,
        type: 'weakness',
        tone: 'negative',
        title: w.title,
        message: w.detail,
        entityType: 'topic',
        entityId: w.entityId,
        priority: w.severity === 'high' ? 'high' : 'medium',
      });
    }

    // Milestone insights from phase completion.
    for (const ph of overview.learning.phaseProgress) {
      if (ph.completionPercent >= 100) {
        insights.push({ id: `milestone:phase-complete:${ph.phaseId}`, type: 'milestone', tone: 'positive', title: `${ph.title} complete`, message: `You've completed every topic in ${ph.title}.`, entityType: 'phase', entityId: ph.phaseId, priority: 'low' });
      } else if (ph.completionPercent >= 75 && ph.completionPercent < 100) {
        insights.push({ id: `milestone:phase-near:${ph.phaseId}`, type: 'milestone', tone: 'neutral', title: `${ph.completionPercent}% through ${ph.title}`, message: `Almost there — ${ph.topicsTotal - ph.topicsCompleted} topics left in ${ph.title}.`, entityType: 'phase', entityId: ph.phaseId, priority: 'low' });
      }
    }

    // Order: high-priority weaknesses, then trends, then positives.
    const rank = { high: 0, medium: 1, low: 2 } as const;
    return insights.sort((a, b) => rank[a.priority] - rank[b.priority]).slice(0, INSIGHT_LIMITS.maxInsights);
  },
};
