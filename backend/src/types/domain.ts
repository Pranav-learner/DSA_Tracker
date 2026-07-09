/** Shared domain-level types and enums used across models, services and DTOs. */

export const DIFFICULTIES = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/**
 * Progress placeholder returned by roadmap/phase endpoints. The mastery engine
 * (a later sprint) will populate these values; the shape is frozen now so the
 * frontend contract never changes.
 */
export interface Progress {
  completedTopics: number;
  totalTopics: number;
  completedProblems: number;
  totalProblems: number;
  percent: number;
}

export function emptyProgress(totalTopics = 0, totalProblems = 0): Progress {
  return {
    completedTopics: 0,
    totalTopics,
    completedProblems: 0,
    totalProblems,
    percent: 0,
  };
}

/* ------------------------------------------------------------------ *
 *  Sprint 2 — Topic Workspace domain types
 * ------------------------------------------------------------------ */

/** Platforms a representative problem can live on. */
export const PLATFORMS = [
  'LeetCode',
  'Codeforces',
  'AtCoder',
  'CSES',
  'HackerRank',
  'SPOJ',
  'GeeksforGeeks',
] as const;
export type Platform = (typeof PLATFORMS)[number];

/** A worked example illustrating the concept. */
export interface ConceptExample {
  title: string;
  detail: string;
}

/**
 * Read-only "representative" problem attached to a topic. This is NOT the
 * problem tracker (a later sprint) — just curated pointers for study.
 */
export interface RepresentativeProblem {
  name: string;
  platform: Platform;
  difficulty: Difficulty;
  pattern: string;
  url?: string;
  estimatedMinutes: number;
}

/* ------------------------------------------------------------------ *
 *  Sprint 3 — Learning Engine (mastery, progress, unlock)
 * ------------------------------------------------------------------ */

/** The six Pattern Ladder stages, in progression order. */
export const LADDER_STAGES = [
  'recognition',
  'implementation',
  'standard',
  'variant',
  'mixed',
  'contest',
] as const;
export type LadderStage = (typeof LADDER_STAGES)[number];

/**
 * The eight weighted mastery metrics. Six mirror the ladder stages; the last
 * two (assessment, confidence) are independent signals.
 */
export const MASTERY_METRICS = [...LADDER_STAGES, 'assessment', 'confidence'] as const;
export type MasteryMetric = (typeof MASTERY_METRICS)[number];

/** A full set of 0–100 metric scores for a topic. */
export type MasteryMetrics = Record<MasteryMetric, number>;

/** Configurable weighting applied to each metric (must sum to 1). */
export type MasteryWeights = Record<MasteryMetric, number>;

export const TOPIC_PROGRESS_STATUSES = [
  'Not Started',
  'In Progress',
  'Completed',
  'Mastered',
] as const;
export type TopicProgressStatus = (typeof TOPIC_PROGRESS_STATUSES)[number];

/** A topic counts toward completion once it reaches these statuses. */
export function isCompletedStatus(status: TopicProgressStatus): boolean {
  return status === 'Completed' || status === 'Mastered';
}

export const PHASE_STATUSES = ['locked', 'in-progress', 'completed'] as const;
export type PhaseStatus = (typeof PHASE_STATUSES)[number];

/* ------------------------------------------------------------------ *
 *  Sprint 4 — Activity (recent learning events, NOT analytics)
 * ------------------------------------------------------------------ */

/**
 * The kinds of learning events surfaced on the dashboard timeline. This is a
 * lightweight event log (not analytics) — future modules append their own
 * event types here as they land.
 */
export const ACTIVITY_TYPES = [
  'topic-started',
  'topic-completed',
  'topic-mastered',
  'topic-unlocked',
  'mastery-updated',
  'phase-unlocked',
  'phase-completed',
  // Module 2 · Sprint 2 — attempt tracking
  'attempt-started',
  'attempt-updated',
  'problem-solved',
  // Module 2 · Sprint 3 — pattern notebook
  'notebook-created',
  'notebook-updated',
  'problem-documented',
  // Module 2 · Sprint 4 — learning integration
  'recommendation-updated',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/**
 * Derived, workspace-level problem status (richer than the stored 3-state
 * `ProblemStatus`). Computed by the LearningIntegrationService from attempts +
 * notebook, never persisted.
 */
export const PROBLEM_LEARNING_STATUSES = [
  'Not Started',
  'Learning',
  'Attempting',
  'Solved',
  'Mastered',
] as const;
export type ProblemLearningStatus = (typeof PROBLEM_LEARNING_STATUSES)[number];

/** The entity an activity refers to. Kept generic so future modules can extend. */
export const ACTIVITY_ENTITY_TYPES = ['topic', 'phase', 'problem'] as const;
export type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number];

/* ------------------------------------------------------------------ *
 *  Module 2 · Sprint 1 — Problem Library
 * ------------------------------------------------------------------ */

/** A user's solve state for a problem (read-only catalog this sprint). */
export const PROBLEM_STATUSES = ['Not Started', 'In Progress', 'Solved'] as const;
export type ProblemStatus = (typeof PROBLEM_STATUSES)[number];

/** Numeric rank for a difficulty — enables correct ordering in queries/sorts. */
export function difficultyRank(difficulty: Difficulty): number {
  return DIFFICULTIES.indexOf(difficulty);
}

/* ------------------------------------------------------------------ *
 *  Module 2 · Sprint 2 — Attempt Tracking Engine
 * ------------------------------------------------------------------ */

/** Lifecycle state of a single attempt. */
export const ATTEMPT_STATUSES = ['Started', 'Solved', 'Abandoned'] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

/** Judge verdicts an attempt can carry. */
export const ATTEMPT_VERDICTS = [
  'Accepted',
  'Wrong Answer',
  'TLE',
  'MLE',
  'RE',
  'CE',
  'Unknown',
] as const;
export type AttemptVerdict = (typeof ATTEMPT_VERDICTS)[number];

/** Languages an attempt can be written in (validated set). */
export const ATTEMPT_LANGUAGES = [
  'C++',
  'C',
  'Python',
  'Java',
  'JavaScript',
  'TypeScript',
  'Go',
  'Rust',
  'Kotlin',
  'C#',
  'Other',
] as const;
export type AttemptLanguage = (typeof ATTEMPT_LANGUAGES)[number];
