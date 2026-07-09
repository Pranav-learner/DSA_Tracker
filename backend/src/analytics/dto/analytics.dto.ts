import type { Difficulty, Platform } from '../../types/domain.js';

/**
 * Analytics response DTOs — flat, typed, chart-agnostic. Sprint 1 returns raw
 * structured metrics only (no chart-specific shaping); Sprint 2 builds
 * visualisations on top of these without changing the contract.
 */

/** A named count, reused for distributions (platform, difficulty, …). */
export interface DistributionSliceDTO<K extends string = string> {
  key: K;
  count: number;
  percent: number;
}

/** A single {date,count} point (buckets, timelines). */
export interface TimePointDTO {
  date: string;
  count: number;
}

export interface PhaseProgressSliceDTO {
  phaseId: string;
  title: string;
  completionPercent: number;
  mastery: number;
  topicsCompleted: number;
  topicsTotal: number;
}

export interface LearningSummaryDTO {
  topicsCompleted: number;
  topicsRemaining: number;
  topicsTotal: number;
  phasesCompleted: number;
  phasesTotal: number;
  completionPercent: number;
  averageMastery: number;
  averageConfidence: number;
  learningVelocityPerWeek: number;
  learningTimeHours: number;
  phaseProgress: PhaseProgressSliceDTO[];
}

export interface ProblemSummaryDTO {
  totalProblems: number;
  solvedProblems: number;
  attemptedProblems: number;
  successRate: number;
  averageSolveTimeMinutes: number;
  platformDistribution: DistributionSliceDTO<Platform>[];
  difficultyDistribution: DistributionSliceDTO<Difficulty>[];
}

export interface KnowledgeSummaryDTO {
  notebookEntries: number;
  representativeProblems: number;
  patternsLearned: number;
  topicsCovered: number;
  coveragePercent: number;
  documentationRate: number;
  averageConfidence: number;
}

export interface RevisionSummaryDTO {
  reviewsCompleted: number;
  overdueReviews: number;
  totalScheduled: number;
  reviewFrequencyPerWeek: number;
  averageReviewDurationMinutes: number;
  revisionConsistencyPercent: number;
}

export interface RetentionSummaryDTO {
  averageRetention: number;
  averageConfidence: number;
  knowledgeHealthPercent: number;
  atRiskTopics: number;
  masteredTopics: number;
  needsReviewTopics: number;
  totalTracked: number;
}

export interface ActivitySummaryDTO {
  totalActivities: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  dailyActivity: TimePointDTO[];
  weeklyActivity: TimePointDTO[];
  monthlyActivity: TimePointDTO[];
}

/** The combined overview returned by GET /api/analytics/overview. */
export interface AnalyticsOverviewDTO {
  learning: LearningSummaryDTO;
  problems: ProblemSummaryDTO;
  knowledge: KnowledgeSummaryDTO;
  revision: RevisionSummaryDTO;
  retention: RetentionSummaryDTO;
  activity: ActivitySummaryDTO;
}

/** Alias matching the brief's naming. */
export type DashboardAnalyticsDTO = AnalyticsOverviewDTO;
