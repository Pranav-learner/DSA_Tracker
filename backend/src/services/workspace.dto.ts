import type { ProblemLearningStatus } from '../types/domain.js';
import type { PhaseRefDTO } from './mappers.js';
import type { ProblemDetailDTO, TopicRefDTO } from './problem.dto.js';
import type { RecommendationDTO } from './learning.dto.js';
import type { AttemptSummaryDTO } from './attempt.dto.js';
import type { RelatedProblemRefDTO } from './notebook.dto.js';
import type { ActivityDTO } from './activity.service.js';

/* Module 2 · Sprint 4 — Problem Workspace + Learning Integration DTOs. */

/** Light notebook reference for the workspace (avoids loading the full entry). */
export interface NotebookRefLiteDTO {
  id: string;
  pattern: string;
  confidence: number;
  revisionCount: number;
  hasMetadata: boolean;
  updatedAt: string;
}

/** "Where this problem sits in the learning system" summary card. */
export interface LearningSummaryDTO {
  topic: TopicRefDTO | null;
  phase: PhaseRefDTO | null;
  topicMastery: number;
  pattern: string;
  representative: boolean;
  confidence: number | null;
  problemStatus: ProblemLearningStatus;
  recommendation: RecommendationDTO;
}

/** Per-topic progress snapshot used by the impact card. */
export interface TopicProgressSnapshotDTO {
  topicId: string;
  status: string;
  mastery: number;
  completionPercent: number;
  topicsCompleted: number;
  topicsTotal: number;
}

/** Dashboard-level aggregates affected by a solve. */
export interface DashboardImpactDTO {
  overallMastery: number;
  completionPercent: number;
  topicsCompleted: number;
  topicsRemaining: number;
}

/**
 * The learning impact of a problem — a snapshot on read, and a before/after
 * delta when returned by POST /complete.
 */
export interface LearningImpactDTO {
  problemId: string;
  currentMastery: number;
  masteryBefore: number | null;
  masteryDelta: number | null;
  topicCompleted: boolean;
  topicProgress: TopicProgressSnapshotDTO | null;
  dashboard: DashboardImpactDTO;
  recommendation: RecommendationDTO;
  /** Set by POST /complete: true when the problem was already solved (no-op). */
  alreadyCompleted?: boolean;
}

/** GET /api/problems/:id/workspace — the whole integrated workspace, one call. */
export interface WorkspaceDTO {
  problem: ProblemDetailDTO;
  attemptSummary: AttemptSummaryDTO;
  notebook: NotebookRefLiteDTO | null;
  learningStatus: ProblemLearningStatus;
  learningSummary: LearningSummaryDTO;
  learningImpact: LearningImpactDTO;
  relatedProblems: RelatedProblemRefDTO[];
  activity: ActivityDTO[];
}
