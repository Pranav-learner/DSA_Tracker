import { analyticsAggregationService } from '../../analytics/services/analyticsAggregation.service.js';
import { patternIntelligenceService } from '../../analytics/services/patternIntelligence.service.js';
import { executiveMetricsService } from '../../analytics/services/executiveMetrics.service.js';
import { phaseService } from '../../services/phase.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { isValidObjectId } from 'mongoose';
import { resolveAnalyticsWindow } from '../../analytics/validators/analytics.validator.js';
import { REPORT_WINDOWS } from '../../config/reports.js';
import type { AnalyticsWindow } from '../../analytics/types/analytics.types.js';
import type { AnalyticsOverviewDTO } from '../../analytics/dto/analytics.dto.js';
import type { ExecutiveScoresDTO } from '../../analytics/dto/executive.dto.js';
import type { PatternIntelligenceOverviewDTO } from '../../analytics/dto/intelligence.dto.js';
import type { AchievementDTO, PhaseReportDTO, ReportDTO, ReportKind, ReportMetricDTO } from '../dto/report.dto.js';

function windowForDays(days: number): AnalyticsWindow {
  return resolveAnalyticsWindow({ from: new Date(Date.now() - days * 86_400_000).toISOString() });
}

function keyMetrics(o: AnalyticsOverviewDTO, scores: ExecutiveScoresDTO): ReportMetricDTO[] {
  return [
    { label: 'Overall Readiness', value: `${scores.overallReadiness}%` },
    { label: 'Completion', value: `${o.learning.completionPercent}%`, hint: `${o.learning.topicsCompleted}/${o.learning.topicsTotal} topics` },
    { label: 'Avg Mastery', value: `${o.learning.averageMastery}%` },
    { label: 'Avg Retention', value: `${o.retention.averageRetention}%` },
    { label: 'Problems Solved', value: `${o.problems.solvedProblems}`, hint: `${o.problems.successRate}% success` },
    { label: 'Reviews Completed', value: `${o.revision.reviewsCompleted}`, hint: 'this period' },
    { label: 'Learning Velocity', value: `${o.learning.learningVelocityPerWeek}/wk` },
    { label: 'Current Streak', value: `${o.activity.currentStreak}d` },
  ];
}

function achievementsFrom(intel: PatternIntelligenceOverviewDTO): AchievementDTO[] {
  const out: AchievementDTO[] = [];
  for (const s of intel.strengths.slice(0, 4)) out.push({ title: s.title, description: s.detail });
  for (const i of intel.insights.filter((x) => x.type === 'milestone' && x.tone === 'positive').slice(0, 2)) {
    out.push({ title: i.title, description: i.message });
  }
  return out.slice(0, 5);
}

function nextGoalsFrom(intel: PatternIntelligenceOverviewDTO, o: AnalyticsOverviewDTO): string[] {
  const goals = intel.recommendations.slice(0, 3).map((r) => r.suggestedAction + (r.entityId ? ` — ${r.title.split(':').pop()?.trim()}` : ''));
  if (o.learning.topicsRemaining > 0) goals.push(`Complete ${Math.min(3, o.learning.topicsRemaining)} more topics to keep momentum`);
  return goals.slice(0, 4);
}

async function buildBase(userId: string, kind: ReportKind, window: AnalyticsWindow, title: string, periodLabel: string): Promise<ReportDTO> {
  const [overview, intel] = await Promise.all([
    analyticsAggregationService.overview(userId, window),
    patternIntelligenceService.overview(userId, window),
  ]);
  const scores = executiveMetricsService.computeScores(overview);
  const a = overview.activity;

  return {
    meta: {
      kind,
      title,
      periodLabel,
      from: window.from ? window.from.toISOString() : null,
      to: window.to.toISOString(),
      generatedAt: new Date().toISOString(),
    },
    scores,
    summary:
      `${periodLabel}: you kept a ${a.currentStreak}-day streak across ${a.activeDays} active days. ` +
      `You're at ${overview.learning.completionPercent}% completion (${overview.learning.averageMastery}% avg mastery) ` +
      `with ${overview.retention.averageRetention}% retention. Overall readiness sits at ${scores.overallReadiness}%.`,
    keyMetrics: keyMetrics(overview, scores),
    overview,
    trends: intel.trends,
    achievements: achievementsFrom(intel),
    strengths: intel.strengths,
    weaknesses: intel.weaknesses,
    recommendations: intel.recommendations,
    nextGoals: nextGoalsFrom(intel, overview),
  };
}

/**
 * ReportService — the sole owner of report composition. Every report is a pure
 * COMPOSITION of existing analytics/intelligence/executive data for a window;
 * no business logic or calculation is duplicated here. Reports are cached.
 */
export const reportService = {
  weekly(userId: string): Promise<ReportDTO> {
    const window = windowForDays(REPORT_WINDOWS.weekly);
    return analyticsAggregationService.section(userId, window, 'report-weekly', () =>
      buildBase(userId, 'weekly', window, 'Weekly Report', 'Last 7 days'),
    );
  },

  monthly(userId: string): Promise<ReportDTO> {
    const window = windowForDays(REPORT_WINDOWS.monthly);
    return analyticsAggregationService.section(userId, window, 'report-monthly', () =>
      buildBase(userId, 'monthly', window, 'Monthly Report', 'Last 30 days'),
    );
  },

  summary(userId: string): Promise<ReportDTO> {
    const window = windowForDays(REPORT_WINDOWS.monthly);
    return analyticsAggregationService.section(userId, window, 'report-summary', () =>
      buildBase(userId, 'summary', window, 'Learning Summary', 'Current snapshot'),
    );
  },

  async phase(userId: string, phaseId: string): Promise<PhaseReportDTO> {
    if (!isValidObjectId(phaseId)) throw ApiError.badRequest('Invalid phase id');
    const phases = await phaseService.list();
    const phase = phases.find((p) => p.id === phaseId);
    if (!phase) throw ApiError.notFound(`Phase '${phaseId}' not found`);

    const window = windowForDays(REPORT_WINDOWS.monthly);
    return analyticsAggregationService.section(userId, window, `report-phase:${phaseId}`, async () => {
      const base = await buildBase(userId, 'phase', window, `${phase.title} — Phase Report`, phase.title);
      const patterns = await patternIntelligenceService.patterns(userId, window);
      const phasePatterns = patterns.filter((p) => p.phaseId === phaseId);
      const slice = base.overview.learning.phaseProgress.find((p) => p.phaseId === phaseId);

      const completion = slice?.completionPercent ?? 0;
      const avgPatternMastery = phasePatterns.length
        ? Math.round(phasePatterns.reduce((s, p) => s + p.overall, 0) / phasePatterns.length)
        : 0;
      const estimatedReadiness = Math.round(0.6 * completion + 0.4 * avgPatternMastery);
      const readinessLabel = estimatedReadiness >= 80 ? 'Ready' : estimatedReadiness >= 60 ? 'Nearly ready' : estimatedReadiness >= 40 ? 'Developing' : 'Early';

      const topicIds = new Set(phasePatterns.map((p) => p.patternId));
      return {
        ...base,
        phase: {
          id: phase.id,
          title: phase.title,
          completionPercent: completion,
          mastery: slice?.mastery ?? 0,
          topicsCompleted: slice?.topicsCompleted ?? 0,
          topicsTotal: slice?.topicsTotal ?? 0,
        },
        patterns: phasePatterns,
        strengths: base.strengths.filter((s) => s.entityId && topicIds.has(s.entityId)),
        weaknesses: base.weaknesses.filter((w) => w.entityId && topicIds.has(w.entityId)),
        estimatedReadiness,
        readinessLabel,
      } satisfies PhaseReportDTO;
    });
  },
};
