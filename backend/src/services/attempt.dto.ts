import type { AttemptLanguage, AttemptStatus, AttemptVerdict } from '../types/domain.js';

/* Module 2 · Sprint 2 — Attempt Tracking response DTOs. */

/** A single attempt, serialised (dates as ISO strings). */
export interface AttemptDTO {
  id: string;
  userId: string;
  problemId: string;
  attemptNumber: number;
  status: AttemptStatus;
  verdict: AttemptVerdict;
  language: AttemptLanguage;
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
  wrongAttempts: number;
  usedHint: boolean;
  usedEditorial: boolean;
  contestAttempt: boolean;
  upsolved: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** Aggregated stats over a problem's attempt history. */
export interface AttemptSummaryDTO {
  problemId: string;
  totalAttempts: number;
  solved: boolean;
  solvedCount: number;
  firstSolvedAt: string | null;
  latestAttemptAt: string | null;
  totalTimeSpent: number; // minutes
  averageSolveTime: number; // minutes, over solved attempts
  hintUsageCount: number;
  editorialUsageCount: number;
  solvedWithoutHint: boolean;
  solvedWithoutEditorial: boolean;
  latestAttempt: AttemptDTO | null;
}
