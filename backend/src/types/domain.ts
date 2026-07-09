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
  // Module 3 · Sprint 1 — revision engine
  'revision-scheduled',
  'revision-due',
  'revision-overdue',
  // Module 3 · Sprint 2 — revision sessions
  'revision-started',
  'revision-paused',
  'revision-resumed',
  'revision-completed',
  'revision-notes-updated',
  // Module 3 · Sprint 3 — retention engine
  'confidence-increased',
  'confidence-decreased',
  'retention-updated',
  'knowledge-strengthened',
  'knowledge-at-risk',
  // Module 4 · Sprint 3 — pattern intelligence & insights
  'insight-generated',
  'pattern-improved',
  'pattern-at-risk',
  'recommendation-created',
  // Module 5 · Sprint 1 — competitive programming engine
  'contest-added',
  'contest-updated',
  'rating-updated',
  // Module 5 · Sprint 2 — contest workspace
  'contest-started',
  'contest-finished',
  'contest-problem-solved',
  // Module 5 · Sprint 3 — contest learning engine
  'contest-reflected',
  'upsolve-created',
  'upsolve-completed',
  'contest-knowledge-added',
  'learning-goal-created',
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

/* ------------------------------------------------------------------ *
 *  Module 3 · Sprint 1 — Revision Engine
 * ------------------------------------------------------------------ */

/** What a revision schedule points at. Generic so future entities can plug in. */
export const REVISION_ENTITY_TYPES = ['topic', 'pattern', 'knowledgeEntry'] as const;
export type RevisionEntityType = (typeof REVISION_ENTITY_TYPES)[number];

/**
 * Lifecycle status. The service stores only Pending / Completed / Archived;
 * Due and Overdue are DERIVED from `nextReviewDate` at read time (never stored),
 * so schedules can't drift as the clock moves.
 */
export const REVISION_STATUSES = ['Pending', 'Due', 'Completed', 'Overdue', 'Archived'] as const;
export type RevisionStatus = (typeof REVISION_STATUSES)[number];

/** Registered scheduling strategies (SM-2 / AI plug in here — no schema change). */
export const REVISION_STRATEGIES = ['default'] as const;
export type RevisionStrategyName = (typeof REVISION_STRATEGIES)[number];

/** Derived queue urgency for a schedule (from its next review date vs. today). */
export const REVISION_URGENCIES = ['overdue', 'due', 'upcoming'] as const;
export type RevisionUrgency = (typeof REVISION_URGENCIES)[number];

/** Lifecycle of an active-review session (Module 3 · Sprint 2). */
export const REVISION_SESSION_STATUSES = ['Started', 'Completed', 'Abandoned'] as const;
export type RevisionSessionStatus = (typeof REVISION_SESSION_STATUSES)[number];

/* ------------------------------------------------------------------ *
 *  Module 3 · Sprint 3 — Retention Engine
 * ------------------------------------------------------------------ */

/** Dynamically-derived retention level for an entity. */
export const RETENTION_LEVELS = [
  'Learning',
  'Familiar',
  'Strong',
  'Mastered',
  'Needs Review',
  'At Risk',
] as const;
export type RetentionLevel = (typeof RETENTION_LEVELS)[number];

/** Direction of the confidence trend. */
export const CONFIDENCE_TRENDS = ['rising', 'falling', 'stable'] as const;
export type ConfidenceTrend = (typeof CONFIDENCE_TRENDS)[number];

/** Registered decay strategies (AI strategies plug in here — no schema change). */
export const DECAY_STRATEGIES = ['default'] as const;
export type DecayStrategyName = (typeof DECAY_STRATEGIES)[number];

/** The entity an activity refers to. Kept generic so future modules can extend. */
export const ACTIVITY_ENTITY_TYPES = ['topic', 'phase', 'problem', 'revision', 'contest'] as const;
export type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number];

/* ---- Module 5 · Sprint 1: Competitive Programming Engine ---- */

/** Contest platforms (distinct from problem PLATFORMS — includes CodeChef). */
export const CONTEST_PLATFORMS = ['Codeforces', 'LeetCode', 'AtCoder', 'CodeChef'] as const;
export type ContestPlatform = (typeof CONTEST_PLATFORMS)[number];

/** Whether a contest counted toward rating. */
export const CONTEST_TYPES = ['Rated', 'Unrated', 'Virtual'] as const;
export type ContestType = (typeof CONTEST_TYPES)[number];

/** Upsolve task lifecycle (Sprint 3). */
export const UPSOLVE_STATUSES = ['Pending', 'In Progress', 'Completed', 'Skipped'] as const;
export type UpsolveStatus = (typeof UPSOLVE_STATUSES)[number];

/** Upsolve task priority. */
export const UPSOLVE_PRIORITIES = ['high', 'medium', 'low'] as const;
export type UpsolvePriority = (typeof UPSOLVE_PRIORITIES)[number];

/** Contest workspace timeline event types (Sprint 2). */
export const CONTEST_EVENT_TYPES = [
  'contest-started',
  'problem-opened',
  'submission',
  'accepted',
  'wrong-answer',
  'tle',
  'mle',
  're',
  'skipped',
  'contest-finished',
] as const;
export type ContestEventType = (typeof CONTEST_EVENT_TYPES)[number];

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
