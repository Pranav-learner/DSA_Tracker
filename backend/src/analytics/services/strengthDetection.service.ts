import { patternAnalyticsService } from './patternAnalytics.service.js';
import { STRENGTH_THRESHOLDS } from '../../config/insights.js';
import type { PatternProfileDTO, StrengthDTO } from '../dto/intelligence.dto.js';

/**
 * StrengthDetectionService — rule-based positive signals over pattern profiles
 * (configurable thresholds). The mirror of WeaknessDetectionService; reuses
 * PatternAnalyticsService.
 */
export const strengthDetectionService = {
  async detect(userId: string, profiles?: PatternProfileDTO[]): Promise<StrengthDTO[]> {
    const list = profiles ?? (await patternAnalyticsService.profiles(userId));
    const T = STRENGTH_THRESHOLDS;
    const out: StrengthDTO[] = [];

    const push = (p: PatternProfileDTO, category: string, metric: string, value: number, title: string, detail: string) => {
      out.push({ id: `${category}:${p.patternId}`, category, title, detail, entityType: 'topic', entityId: p.patternId, metric, value });
    };

    for (const p of list) {
      if (p.overall >= T.strongMastery) {
        push(p, 'strong-topic', 'mastery', p.overall, `${p.title} is strong`, `Overall mastery is ${p.overall}%.`);
      }
      if (p.matrix.confidence >= T.highConfidence) {
        push(p, 'high-confidence', 'confidence', p.matrix.confidence, `High confidence in ${p.title}`, `Confidence is ${p.matrix.confidence}%.`);
      }
      if (p.problemsSolved >= 2 && p.averageSolveTimeMinutes > 0 && p.averageSolveTimeMinutes <= T.fastSolveTimeMinutes) {
        push(p, 'fast-solver', 'averageSolveTimeMinutes', p.averageSolveTimeMinutes, `Fast on ${p.title}`, `Average solve time is just ${p.averageSolveTimeMinutes}m.`);
      }
      if (p.reviewCount >= 1 && p.matrix.retention >= T.excellentRetention) {
        push(p, 'excellent-retention', 'retention', p.matrix.retention, `Excellent retention on ${p.title}`, `Retention is ${p.matrix.retention}%.`);
      }
      if (p.reviewCount >= 2 && p.revisionSuccessRate >= T.highRevisionSuccess) {
        push(p, 'high-revision-consistency', 'revisionSuccessRate', p.revisionSuccessRate, `Consistent revisions on ${p.title}`, `Revision success is ${p.revisionSuccessRate}%.`);
      }
      if (p.confidenceTrendDirection === 'rising' && p.confidenceTrendDelta >= T.recentImprovementDelta) {
        push(p, 'recent-improvement', 'confidenceTrendDelta', p.confidenceTrendDelta, `${p.title} is improving`, `Confidence rose by ${p.confidenceTrendDelta} points recently.`);
      }
    }

    // Strongest signals first.
    return out.sort((a, b) => b.value - a.value);
  },
};
