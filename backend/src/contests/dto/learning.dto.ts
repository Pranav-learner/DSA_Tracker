import type { UpsolvePriority, UpsolveStatus } from '../../types/domain.js';

export interface LearningGoalDTO {
  text: string;
  topicId: string | null;
  done: boolean;
}

export interface ContestPostmortemDTO {
  id: string;
  contestRef: string;
  overallPerformance: string;
  whatWentWell: string;
  whatWentWrong: string;
  biggestMistake: string;
  biggestLearning: string;
  nextFocus: string;
  timeManagementNotes: string;
  strengths: string[];
  weaknesses: string[];
  missedPatterns: string[];
  implementationMistakes: string[];
  debuggingMistakes: string[];
  algorithmGaps: string[];
  learningGoals: LearningGoalDTO[];
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsolveTaskDTO {
  id: string;
  contestRef: string;
  contestProblemRef: string;
  topicId: string | null;
  pattern: string;
  priority: UpsolvePriority;
  status: UpsolveStatus;
  estimatedTime: number;
  linkedKnowledgeEntry: string | null;
  linkedRevisionSchedule: string | null;
  problemCode: string;
  problemName: string;
  url: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Upsolve queue grouped by status + summary counts. */
export interface UpsolveQueueDTO {
  pending: UpsolveTaskDTO[];
  inProgress: UpsolveTaskDTO[];
  completed: UpsolveTaskDTO[];
  skipped: UpsolveTaskDTO[];
  counts: { pending: number; inProgress: number; completed: number; skipped: number; total: number };
  estimatedRemainingMinutes: number;
}

/** Pattern analysis for a contest (reuses contest problems + Pattern Intelligence). */
export interface ContestPatternAnalysisDTO {
  patternsSolved: string[];
  patternsMissed: string[];
  patternsToPractice: { pattern: string; topicId: string | null; reason: string }[];
}

/** Algorithm gap analysis derived from unsolved/weak areas. */
export interface AlgorithmGapDTO {
  label: string;
  detail: string;
  topicId: string | null;
  severity: 'high' | 'medium' | 'low';
}

/** The full Contest Learning workspace payload. */
export interface ContestLearningDTO {
  contestRef: string;
  postmortem: ContestPostmortemDTO | null;
  upsolve: UpsolveTaskDTO[];
  patternAnalysis: ContestPatternAnalysisDTO;
  algorithmGaps: AlgorithmGapDTO[];
  suggestedLearningGoals: string[];
}
