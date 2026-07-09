import type { ContestEventType } from '../../types/domain.js';
import type { ContestDTO } from './contest.dto.js';

/** Derived per-problem status for the workspace table. */
export type ContestProblemStatus = 'solved' | 'attempted' | 'skipped' | 'unattempted';

export interface ContestProblemDTO {
  id: string;
  contestRef: string;
  problemCode: string;
  problemName: string;
  platformProblemId: string;
  url: string;
  index: string;
  difficulty: string;
  tags: string[];
  solved: boolean;
  skipped: boolean;
  attempted: boolean;
  attempts: number;
  firstAttemptAt: string | null;
  solvedAt: string | null;
  totalTimeSpent: number;
  penalty: number;
  status: ContestProblemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ContestTimelineEventDTO {
  id: string;
  contestRef: string;
  timestamp: string;
  eventType: ContestEventType;
  problemRef: string | null;
  problemCode: string;
  description: string;
  /** Minutes from contest start (null if start time unknown / before start). */
  offsetMinutes: number | null;
}

export interface ContestPerformanceDTO {
  contestRef: string;
  totalSolved: number;
  totalAttempts: number;
  wrongAttempts: number;
  penalty: number;
  averageSolveTime: number;
  fastestSolve: number | null;
  slowestSolve: number | null;
  contestDurationMinutes: number;
  problemSuccessRate: number;
  solvedProblems: string[];
  unsolvedProblems: string[];
  skippedProblems: string[];
}

/** Statistics cards derived from performance + problems + contest duration. */
export interface ContestStatisticsDTO {
  acceptanceRate: number;
  problemsAttempted: number;
  problemsSkipped: number;
  averageAttempts: number;
  averageSolveTime: number;
  contestEfficiency: number; // solved / total problems
  contestPace: number; // solved per hour
}

/** The full workspace payload (GET /api/contests/:id/workspace). */
export interface ContestWorkspaceDTO {
  contest: ContestDTO;
  problems: ContestProblemDTO[];
  performance: ContestPerformanceDTO;
  timeline: ContestTimelineEventDTO[];
  statistics: ContestStatisticsDTO;
  notes: string;
}
