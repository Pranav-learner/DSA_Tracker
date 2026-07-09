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
