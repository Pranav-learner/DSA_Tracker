import type { InsightDTO, AnalyticsRecommendationDTO } from './intelligence.dto.js';

export type ScoreStatus = 'excellent' | 'good' | 'fair' | 'at-risk';

/** The six composite executive scores (0–100). */
export interface ExecutiveScoresDTO {
  learning: number;
  knowledge: number;
  retention: number;
  revision: number;
  productivity: number;
  overallReadiness: number;
}

/** One score dimension as a labelled, banded indicator. */
export interface ScoreBreakdownDTO {
  key: string;
  label: string;
  score: number;
  status: ScoreStatus;
}

/** Headline progress figures surfaced on the executive dashboard. */
export interface ExecutiveProgressDTO {
  completionPercent: number;
  overallMastery: number;
  averageRetention: number;
  learningVelocityPerWeek: number;
  knowledgeCoveragePercent: number;
  revisionConsistencyPercent: number;
}

export interface ExecutiveDTO {
  scores: ExecutiveScoresDTO;
  breakdown: ScoreBreakdownDTO[];
  progress: ExecutiveProgressDTO;
  currentPhase: { id: string; title: string; completionPercent: number } | null;
  currentTopic: { id: string; title: string } | null;
  patternHealth: { strong: number; developing: number; needsWork: number; total: number };
  insights: InsightDTO[];
  recommendations: AnalyticsRecommendationDTO[];
}
