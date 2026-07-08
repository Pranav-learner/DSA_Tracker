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
