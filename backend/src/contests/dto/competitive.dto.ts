import type { ContestPlatform } from '../../types/domain.js';
import type { StrengthDTO, WeaknessDTO } from '../../analytics/dto/intelligence.dto.js';

export type ReadinessStatus = 'ready' | 'developing' | 'early' | 'not-ready';
export type CorrelationDirection = 'positive' | 'negative' | 'neutral';
export type CorrelationStrength = 'strong' | 'moderate' | 'weak';

export interface RatingAnalysisDTO {
  currentRating: number | null;
  highestRating: number | null;
  lowestRating: number | null;
  averageRating: number | null;
  ratingTrend: 'rising' | 'falling' | 'stable';
  ratingGrowth: number;
  averageRatingGain: number;
  largestGain: number;
  largestLoss: number;
  contestConsistency: number; // % of rated contests without a rating loss
  ratedContests: number;
  timeline: { date: string; rating: number }[];
  platformStats: { platform: ContestPlatform; current: number | null; highest: number | null; contests: number }[];
}

export interface ReadinessSubScoreDTO {
  key: string;
  label: string;
  score: number;
  status: ReadinessStatus;
}

export interface ContestReadinessDTO {
  overall: number;
  status: ReadinessStatus;
  breakdown: ReadinessSubScoreDTO[];
  strongAreas: string[];
  weakAreas: string[];
}

export interface CorrelationItemDTO {
  key: string;
  label: string;
  xLabel: string;
  yLabel: string;
  xValue: number;
  yValue: number;
  direction: CorrelationDirection;
  strength: CorrelationStrength;
  insight: string;
}

export interface ContestCorrelationDTO {
  items: CorrelationItemDTO[];
}

export type CompetitiveInsightType = 'strength' | 'weakness' | 'opportunity' | 'improvement' | 'warning' | 'focus';

export interface CompetitiveInsightDTO {
  id: string;
  type: CompetitiveInsightType;
  severity: 'high' | 'medium' | 'low';
  title: string;
  reason: string;
  suggestedAction: string;
  relatedTopics: { id: string; title: string }[];
}

export type CompetitiveActionType =
  | 'practice-contest'
  | 'virtual-contest'
  | 'upsolve'
  | 'revise-patterns'
  | 'strengthen-topic'
  | 'improve-speed';

export interface CompetitiveRecommendationDTO {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  reason: string;
  suggestedAction: string;
  actionType: CompetitiveActionType;
  to: string;
  estimatedTimeMinutes: number;
  learningImpact: 'high' | 'medium' | 'low';
}

/** Backend-only readiness profile (contest computed; interview/HFT placeholders). */
export interface ReadinessProfileDTO {
  contestReadiness: number;
  interviewReadiness: number;
  hftReadiness: number;
  breakdown: {
    pattern: number;
    implementation: number;
    revision: number;
    knowledge: number;
    recentPractice: number;
    contestFrequency: number;
  };
}

/** The combined competitive-intelligence payload. */
export interface CompetitiveIntelligenceDTO {
  summary: {
    headline: string;
    overallReadiness: number;
    readinessStatus: ReadinessStatus;
    currentRating: number | null;
    ratingTrend: 'rising' | 'falling' | 'stable';
    pendingUpsolve: number;
  };
  strengths: StrengthDTO[];
  weaknesses: WeaknessDTO[];
  insights: CompetitiveInsightDTO[];
  recommendations: CompetitiveRecommendationDTO[];
  readiness: ContestReadinessDTO;
  correlation: ContestCorrelationDTO;
  ratingAnalysis: RatingAnalysisDTO;
}
