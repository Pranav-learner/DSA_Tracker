import { patternAnalyticsService } from './patternAnalytics.service.js';
import { WEAKNESS_THRESHOLDS, SEVERITY_BANDS } from '../../config/insights.js';
import type { PatternProfileDTO, Severity, WeaknessDTO } from '../dto/intelligence.dto.js';

/** Severity from how far (in points) a signal sits past its threshold. */
function severity(gap: number): Severity {
  if (gap >= SEVERITY_BANDS.high) return 'high';
  if (gap >= SEVERITY_BANDS.medium) return 'medium';
  return 'low';
}

const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

/**
 * WeaknessDetectionService — rule-based weakness signals over pattern profiles.
 * Every rule reads a configurable threshold (config/insights.ts); nothing is
 * hardcoded. Reuses PatternAnalyticsService (no duplicated aggregation).
 */
export const weaknessDetectionService = {
  async detect(userId: string, profiles?: PatternProfileDTO[]): Promise<WeaknessDTO[]> {
    const list = profiles ?? (await patternAnalyticsService.profiles(userId));
    const T = WEAKNESS_THRESHOLDS;
    const out: WeaknessDTO[] = [];

    const push = (
      p: PatternProfileDTO,
      category: string,
      metric: string,
      value: number,
      threshold: number,
      gap: number,
      title: string,
      detail: string,
      hint: string,
    ) => {
      out.push({
        id: `${category}:${p.patternId}`,
        category,
        severity: severity(gap),
        title,
        detail,
        entityType: 'topic',
        entityId: p.patternId,
        metric,
        value,
        threshold,
        recommendationHint: hint,
      });
    };

    for (const p of list) {
      if (p.overall < T.lowMastery) {
        push(p, 'low-mastery', 'mastery', p.overall, T.lowMastery, T.lowMastery - p.overall, `${p.title} has low mastery`, `Overall mastery is ${p.overall}% (target ${T.lowMastery}%+).`, 'Practice more problems and re-derive the core template.');
      }
      if (p.matrix.confidence < T.lowConfidence) {
        push(p, 'low-confidence', 'confidence', p.matrix.confidence, T.lowConfidence, T.lowConfidence - p.matrix.confidence, `Confidence gap in ${p.title}`, `Confidence is ${p.matrix.confidence}%.`, 'Schedule a focused revision to rebuild confidence.');
      }
      if (p.reviewCount > 0 && p.matrix.retention < T.lowRetention) {
        push(p, 'at-risk-knowledge', 'retention', p.matrix.retention, T.lowRetention, T.lowRetention - p.matrix.retention, `${p.title} is fading`, `Retention has dropped to ${p.matrix.retention}%.`, 'Revise now to protect retention.');
      }
      if (p.problemsSolved >= 3 && p.hintDependency >= T.highHintDependency) {
        push(p, 'high-hint-usage', 'hintDependency', p.hintDependency, T.highHintDependency, p.hintDependency - T.highHintDependency, `High hint usage in ${p.title}`, `${p.hintDependency}% of solves needed a hint.`, 'Attempt easier variants without hints first.');
      }
      if (p.problemsSolved >= 3 && p.editorialDependency >= T.highEditorialDependency) {
        push(p, 'high-editorial-dependency', 'editorialDependency', p.editorialDependency, T.highEditorialDependency, p.editorialDependency - T.highEditorialDependency, `High editorial dependency in ${p.title}`, `${p.editorialDependency}% of solves needed the editorial.`, 'Practice easier problems to build independent solving.');
      }
      if (p.problemsSolved >= 1 && p.averageSolveTimeMinutes >= T.slowSolveTimeMinutes) {
        push(p, 'slow-solve-time', 'averageSolveTimeMinutes', p.averageSolveTimeMinutes, T.slowSolveTimeMinutes, p.averageSolveTimeMinutes - T.slowSolveTimeMinutes, `Slow implementation in ${p.title}`, `Average solve time is ${p.averageSolveTimeMinutes}m.`, 'Drill the implementation template to build speed.');
      }
      if (p.problemsAttempted >= 3 && p.attemptSuccessRate < T.lowSuccessRate) {
        push(p, 'high-failure-rate', 'attemptSuccessRate', p.attemptSuccessRate, T.lowSuccessRate, T.lowSuccessRate - p.attemptSuccessRate, `Low success rate in ${p.title}`, `Attempt success is ${p.attemptSuccessRate}%.`, 'Revisit fundamentals before harder problems.');
      }
      if (p.reviewCount >= 2 && p.revisionSuccessRate < T.lowRevisionSuccess) {
        push(p, 'low-revision-consistency', 'revisionSuccessRate', p.revisionSuccessRate, T.lowRevisionSuccess, T.lowRevisionSuccess - p.revisionSuccessRate, `Weak revisions for ${p.title}`, `Revision success is ${p.revisionSuccessRate}%.`, 'Slow down reviews and re-derive from scratch.');
      }
      if (p.status !== 'strong' && p.problemsSolved === 0) {
        push(p, 'knowledge-gap', 'problemsSolved', 0, 1, SEVERITY_BANDS.medium, `No practice in ${p.title}`, 'No problems solved yet for this pattern.', 'Solve a few representative problems to close the gap.');
      }
    }

    return out.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.threshold - b.value - (a.threshold - a.value));
  },
};
