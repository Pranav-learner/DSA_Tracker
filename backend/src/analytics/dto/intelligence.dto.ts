/**
 * Pattern-Intelligence response DTOs — flat, typed, rule-based (no AI). Every
 * value is derived from existing analytics/mastery/retention data.
 */

export type PatternStatus = 'strong' | 'developing' | 'needs-work';
export type Severity = 'high' | 'medium' | 'low';
export type TrendDirection = 'increasing' | 'stable' | 'declining';
export type InsightType = 'strength' | 'weakness' | 'trend' | 'milestone';
export type InsightTone = 'positive' | 'negative' | 'neutral';
export type Priority = 'high' | 'medium' | 'low';
export type LearningImpact = 'high' | 'medium' | 'low';

/** The Pattern Confidence Matrix — eight 0–100 dimensions per pattern. */
export interface PatternMatrixDTO {
  understanding: number;
  recognition: number;
  implementation: number;
  optimization: number;
  contestReadiness: number; // placeholder dimension this sprint
  confidence: number;
  retention: number;
  overallMastery: number;
}

/** A full intelligence profile for one pattern (topic). */
export interface PatternProfileDTO {
  patternId: string; // topicId
  title: string;
  phaseId: string;
  phaseTitle: string;
  status: PatternStatus;
  isWeak: boolean;
  isStrong: boolean;
  matrix: PatternMatrixDTO;
  // Behavioural signals
  attemptSuccessRate: number;
  averageSolveTimeMinutes: number;
  revisionSuccessRate: number;
  hintDependency: number;
  editorialDependency: number;
  problemsSolved: number;
  problemsAttempted: number;
  reviewCount: number;
  confidenceTrendDirection: 'rising' | 'falling' | 'stable';
  confidenceTrendDelta: number;
  overall: number;
  updatedAt: string | null;
}

export interface WeaknessDTO {
  id: string;
  category: string;
  severity: Severity;
  title: string;
  detail: string;
  entityType: 'topic' | 'pattern' | 'knowledgeEntry' | 'global';
  entityId: string | null;
  metric: string;
  value: number;
  threshold: number;
  recommendationHint: string;
}

export interface StrengthDTO {
  id: string;
  category: string;
  title: string;
  detail: string;
  entityType: 'topic' | 'pattern' | 'knowledgeEntry' | 'global';
  entityId: string | null;
  metric: string;
  value: number;
}

export interface TrendDTO {
  key: string;
  label: string;
  current: number;
  previous: number;
  delta: number;
  direction: TrendDirection;
  unit: string;
}

export interface InsightDTO {
  id: string;
  type: InsightType;
  tone: InsightTone;
  title: string;
  message: string;
  entityType: 'topic' | 'pattern' | 'knowledgeEntry' | 'phase' | 'global';
  entityId: string | null;
  priority: Priority;
}

export interface AnalyticsRecommendationDTO {
  id: string;
  priority: Priority;
  title: string;
  reason: string;
  suggestedAction: string;
  actionType: 'open-topic' | 'start-revision' | 'review-notebook' | 'practice-problems';
  to: string;
  estimatedTimeMinutes: number;
  learningImpact: LearningImpact;
  entityType: 'topic' | 'pattern' | 'knowledgeEntry' | 'global';
  entityId: string | null;
}

/** Combined pattern-intelligence overview (dashboard consumption). */
export interface PatternIntelligenceOverviewDTO {
  patterns: PatternProfileDTO[];
  weaknesses: WeaknessDTO[];
  strengths: StrengthDTO[];
  trends: TrendDTO[];
  insights: InsightDTO[];
  recommendations: AnalyticsRecommendationDTO[];
}
