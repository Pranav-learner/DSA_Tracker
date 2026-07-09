import type { AnalyticsOverviewDTO } from '../../analytics/dto/analytics.dto.js';
import type { ExecutiveScoresDTO } from '../../analytics/dto/executive.dto.js';
import type {
  AnalyticsRecommendationDTO,
  PatternProfileDTO,
  StrengthDTO,
  TrendDTO,
  WeaknessDTO,
} from '../../analytics/dto/intelligence.dto.js';

export type ReportKind = 'weekly' | 'monthly' | 'summary' | 'phase';

export interface ReportMetaDTO {
  kind: ReportKind;
  title: string;
  periodLabel: string;
  from: string | null;
  to: string;
  generatedAt: string;
}

export interface ReportMetricDTO {
  label: string;
  value: string;
  hint?: string;
}

export interface AchievementDTO {
  title: string;
  description: string;
}

/**
 * The base report — a COMPOSITION of existing analytics/intelligence/executive
 * data for a time window. Reports summarise; they never recompute.
 */
export interface ReportDTO {
  meta: ReportMetaDTO;
  scores: ExecutiveScoresDTO;
  summary: string;
  keyMetrics: ReportMetricDTO[];
  overview: AnalyticsOverviewDTO;
  trends: TrendDTO[];
  achievements: AchievementDTO[];
  strengths: StrengthDTO[];
  weaknesses: WeaknessDTO[];
  recommendations: AnalyticsRecommendationDTO[];
  nextGoals: string[];
}

/** Phase completion report — the base report + phase-scoped extras. */
export interface PhaseReportDTO extends ReportDTO {
  phase: {
    id: string;
    title: string;
    completionPercent: number;
    mastery: number;
    topicsCompleted: number;
    topicsTotal: number;
  };
  patterns: PatternProfileDTO[];
  estimatedReadiness: number;
  readinessLabel: string;
}
