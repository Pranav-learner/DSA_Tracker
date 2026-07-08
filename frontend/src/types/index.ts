/** Shared API DTO types — mirror the backend contract exactly. */

export type Difficulty = 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface Progress {
  completedTopics: number;
  totalTopics: number;
  completedProblems: number;
  totalProblems: number;
  percent: number;
}

export interface Phase {
  id: string;
  title: string;
  slug: string;
  order: number;
  description: string;
  icon: string;
  estimatedWeeks: number;
  estimatedProblems: number;
  color: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  topicCount: number;
  progress: Progress;
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  phaseId: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  estimatedHours: number;
  estimatedProblems: number;
  difficulty: Difficulty;
  isUnlocked: boolean;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapStats {
  totalPhases: number;
  unlockedPhases: number;
  completedPhases: number;
  totalTopics: number;
  totalEstimatedWeeks: number;
  totalEstimatedProblems: number;
}

export interface Roadmap {
  phases: Phase[];
  stats: RoadmapStats;
  progress: Progress;
}

/** Success envelope returned by every backend endpoint. */
export interface ApiEnvelope<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}
