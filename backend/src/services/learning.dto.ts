import type {
  LadderStage,
  MasteryMetrics,
  MasteryWeights,
  PhaseStatus,
  TopicProgressStatus,
} from '../types/domain.js';
import type { PhaseRefDTO, TopicSummaryDTO } from './mappers.js';

/* Sprint 3 — Learning Engine response DTOs (contracts consumed by the frontend). */

export interface LadderStageDTO {
  stage: LadderStage;
  progress: number; // 0–100 (the stage's metric score)
  completed: boolean;
  unlocked: boolean;
  startedAt: string | null;
  completedAt: string | null;
}

export interface TopicProgressDTO {
  userId: string;
  topicId: string;
  status: TopicProgressStatus;
  overallMastery: number;
  currentStage: LadderStage;
  metrics: MasteryMetrics;
  assessmentPassed: boolean;
  unlocked: boolean;
  ladder: LadderStageDTO[];
  startedAt: string | null;
  lastStudied: string | null;
  completedAt: string | null;
}

export interface MasteryDTO {
  topicId: string;
  overallMastery: number;
  status: TopicProgressStatus;
  metrics: MasteryMetrics;
  weights: MasteryWeights;
  ladder: LadderStageDTO[];
}

/** Per-topic overlay attached to the roadmap for a user. */
export interface TopicOverlayDTO {
  topicId: string;
  phaseId: string;
  order: number;
  status: TopicProgressStatus;
  mastery: number;
  confidence: number;
  assessmentPassed: boolean;
  unlocked: boolean;
  currentStage: LadderStage;
}

export interface PhaseProgressDTO {
  phaseId: string;
  status: PhaseStatus;
  completionPercent: number;
  mastery: number;
  topicsCompleted: number;
  topicsTotal: number;
  estimatedTimeSpentHours: number;
  completedAt: string | null;
}

export interface OverallProgressDTO {
  topicsTotal: number;
  topicsCompleted: number;
  topicsRemaining: number;
  phasesTotal: number;
  phasesCompleted: number;
  completionPercent: number;
  overallMastery: number;
  averageTopicMastery: number;
  averageConfidence: number;
}

export interface ProgressDTO {
  overall: OverallProgressDTO;
  currentPhaseId: string | null;
  currentTopicId: string | null;
  currentStage: LadderStage;
  phases: PhaseProgressDTO[];
  topics: TopicOverlayDTO[];
}

export type RecommendationType =
  | 'start-learning'
  | 'continue-topic'
  | 'complete-assessment'
  | 'next-topic'
  | 'phase-reflection';

export interface RecommendationDTO {
  type: RecommendationType;
  title: string;
  message: string;
  topicId: string | null;
  phaseId: string | null;
  actionLabel: string;
  actionTo: string;
}

export interface LearningStateDTO {
  userId: string;
  currentPhase: PhaseRefDTO | null;
  currentTopic: TopicSummaryDTO | null;
  currentStage: LadderStage | null;
  currentMastery: number;
  overall: OverallProgressDTO;
  recommendation: RecommendationDTO;
}
