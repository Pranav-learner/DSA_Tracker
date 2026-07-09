import { patternAnalyticsService } from './patternAnalytics.service.js';
import { weaknessDetectionService } from './weaknessDetection.service.js';
import { INSIGHT_LIMITS } from '../../config/insights.js';
import type {
  AnalyticsRecommendationDTO,
  LearningImpact,
  PatternProfileDTO,
  Priority,
  Severity,
  WeaknessDTO,
} from '../dto/intelligence.dto.js';

export interface RecommendationContext {
  profiles?: PatternProfileDTO[];
  weaknesses?: WeaknessDTO[];
}

type ActionType = AnalyticsRecommendationDTO['actionType'];

/** Weakness category → the corrective action + rough time cost. */
const ACTION_BY_CATEGORY: Record<string, { action: ActionType; minutes: number; verb: string }> = {
  'low-mastery': { action: 'practice-problems', minutes: 30, verb: 'Practice more problems' },
  'high-failure-rate': { action: 'practice-problems', minutes: 30, verb: 'Revisit fundamentals & practice' },
  'knowledge-gap': { action: 'practice-problems', minutes: 25, verb: 'Solve representative problems' },
  'high-hint-usage': { action: 'practice-problems', minutes: 25, verb: 'Practice without hints' },
  'high-editorial-dependency': { action: 'practice-problems', minutes: 25, verb: 'Practice easier problems' },
  'slow-solve-time': { action: 'practice-problems', minutes: 20, verb: 'Drill the implementation' },
  'low-confidence': { action: 'start-revision', minutes: 15, verb: 'Schedule a revision' },
  'at-risk-knowledge': { action: 'start-revision', minutes: 15, verb: 'Revise now' },
  'low-revision-consistency': { action: 'start-revision', minutes: 15, verb: 'Re-derive from scratch' },
};

function routeFor(action: ActionType, entityId: string | null): string {
  switch (action) {
    case 'open-topic':
      return entityId ? `/topic/${entityId}` : '/roadmap';
    case 'start-revision':
      return '/revision';
    case 'review-notebook':
      return '/notebook';
    case 'practice-problems':
    default:
      return '/problems';
  }
}

const priorityFromSeverity: Record<Severity, Priority> = { high: 'high', medium: 'medium', low: 'low' };
const impactFromSeverity: Record<Severity, LearningImpact> = { high: 'high', medium: 'medium', low: 'low' };

/**
 * AnalyticsRecommendationService — rule-based, actionable recommendations from
 * detected weaknesses (and strong patterns → "move on"). Extends the analytics
 * layer WITHOUT modifying the Module 1 RecommendationService; it complements it
 * with insight-driven actions. No AI.
 */
export const analyticsRecommendationService = {
  async generate(userId: string, ctx: RecommendationContext = {}): Promise<AnalyticsRecommendationDTO[]> {
    const profiles = ctx.profiles ?? (await patternAnalyticsService.profiles(userId));
    const weaknesses = ctx.weaknesses ?? (await weaknessDetectionService.detect(userId, profiles));

    const recs: AnalyticsRecommendationDTO[] = [];
    const seen = new Set<string>();

    // Corrective recommendations from the most severe weaknesses.
    for (const w of weaknesses) {
      const map = ACTION_BY_CATEGORY[w.category];
      if (!map) continue;
      const dedupKey = `${w.entityId}:${map.action}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);
      recs.push({
        id: `rec:${w.id}`,
        priority: priorityFromSeverity[w.severity],
        title: `${map.verb}: ${titleOf(profiles, w.entityId)}`,
        reason: w.detail,
        suggestedAction: map.verb,
        actionType: map.action,
        to: routeFor(map.action, w.entityId),
        estimatedTimeMinutes: map.minutes,
        learningImpact: impactFromSeverity[w.severity],
        entityType: 'topic',
        entityId: w.entityId,
      });
    }

    // Progression recommendations — strong patterns invite moving on.
    for (const p of profiles.filter((x) => x.isStrong).slice(0, 3)) {
      const dedupKey = `${p.patternId}:open-topic`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);
      recs.push({
        id: `rec:progress:${p.patternId}`,
        priority: 'low',
        title: `${p.title} is mastered — move on`,
        reason: `${p.title} is consistently strong (${p.overall}% mastery). Build on it with the next pattern.`,
        suggestedAction: 'Open next topic',
        actionType: 'open-topic',
        to: routeFor('open-topic', p.patternId),
        estimatedTimeMinutes: 45,
        learningImpact: 'medium',
        entityType: 'topic',
        entityId: p.patternId,
      });
    }

    const rank = { high: 0, medium: 1, low: 2 } as const;
    return recs.sort((a, b) => rank[a.priority] - rank[b.priority]).slice(0, INSIGHT_LIMITS.maxRecommendations);
  },
};

function titleOf(profiles: PatternProfileDTO[], entityId: string | null): string {
  return profiles.find((p) => p.patternId === entityId)?.title ?? 'this pattern';
}
