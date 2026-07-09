import type { ConfidenceTrend, RetentionLevel, RevisionEntityType } from '../types/domain.js';

/* Module 3 · Sprint 3 — Retention Engine response DTOs. */

export interface RetentionSnapshotDTO {
  confidenceScore: number;
  retentionScore: number;
  level: RetentionLevel;
  reason: string;
  date: string;
}

/** Confidence trend: direction + delta + a short series for the sparkline. */
export interface ConfidenceTrendDTO {
  direction: ConfidenceTrend;
  delta: number;
  series: { date: string; value: number }[];
}

export interface RetentionProfileDTO {
  id: string;
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  topicId: string | null;
  confidenceScore: number;
  retentionScore: number;
  decayScore: number;
  currentLevel: RetentionLevel;
  reviewCount: number;
  successfulReviews: number;
  missedReviews: number;
  overdueReviews: number;
  averageReviewInterval: number;
  successRate: number;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  daysUntilReview: number | null;
  isOverdue: boolean;
  strategy: string;
  confidenceTrend: ConfidenceTrendDTO;
  history: RetentionSnapshotDTO[];
  createdAt: string;
  updatedAt: string;
}

/** Light profile reference (for at-risk / overview lists). */
export interface RetentionProfileRefDTO {
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  topicId: string | null;
  confidenceScore: number;
  retentionScore: number;
  currentLevel: RetentionLevel;
}

export interface RetentionOverviewDTO {
  totalProfiles: number;
  averageConfidence: number;
  averageRetention: number;
  masteredCount: number;
  strongCount: number;
  familiarCount: number;
  learningCount: number;
  needsReviewCount: number;
  atRiskCount: number;
  overdueReviews: number;
  revisionSuccessRate: number;
  confidenceTrend: ConfidenceTrendDTO;
  atRisk: RetentionProfileRefDTO[];
}

export interface ConfidenceEntryDTO {
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  confidenceScore: number;
  trend: ConfidenceTrend;
  currentLevel: RetentionLevel;
}

export interface ConfidenceOverviewDTO {
  averageConfidence: number;
  trend: ConfidenceTrendDTO;
  entries: ConfidenceEntryDTO[];
}

/** A history row across all entities (for GET /retention/history). */
export interface RetentionHistoryRowDTO {
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  snapshot: RetentionSnapshotDTO;
}

/** Compact retention block embedded in the Module 1 dashboard. */
export interface DashboardRetentionDTO {
  averageConfidence: number;
  averageRetention: number;
  atRiskCount: number;
  needsReviewCount: number;
  masteredCount: number;
  overdueReviews: number;
  revisionSuccessRate: number;
  trendDirection: ConfidenceTrend;
  trendDelta: number;
}
