import type { Difficulty, Platform, ProblemStatus } from '../types/domain.js';
import type { PhaseRefDTO } from './mappers.js';

/* Module 2 · Sprint 1 — Problem Library response DTOs. */

/** Lightweight topic reference embedded in a problem detail. */
export interface TopicRefDTO {
  id: string;
  title: string;
  slug: string;
  phaseId: string;
}

/** A problem as it appears in the library list/table/grid. */
export interface ProblemListItemDTO {
  id: string;
  title: string;
  slug: string;
  platform: Platform;
  platformProblemId: string;
  url: string;
  difficulty: Difficulty;
  pattern: string;
  tags: string[];
  representative: boolean;
  estimatedSolveTime: number;
  phaseId: string;
  topicId: string;
  editorialUrl?: string;
  /** Per-user overlay (defaults when the user has no record yet). */
  status: ProblemStatus;
  favorite: boolean;
}

/** Full problem detail (adds resolved topic/phase refs + timestamps). */
export interface ProblemDetailDTO extends ProblemListItemDTO {
  topic: TopicRefDTO | null;
  phase: PhaseRefDTO | null;
  lastViewed: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Generic pagination envelope (reusable by later library-style resources). */
export interface PaginatedDTO<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Available filter values, so the FilterPanel is data-driven. */
export interface ProblemFacetsDTO {
  platforms: Platform[];
  difficulties: Difficulty[];
  patterns: string[];
  statuses: ProblemStatus[];
}

/** Normalised, validated query for the library list/search. */
export interface ProblemQuery {
  page: number;
  pageSize: number;
  q?: string;
  platform?: Platform;
  difficulty?: Difficulty;
  phase?: string;
  topic?: string;
  pattern?: string;
  status?: ProblemStatus;
  representative?: boolean;
  favorite?: boolean;
  sort: ProblemSortField;
  order: 'asc' | 'desc';
}

export const PROBLEM_SORT_FIELDS = [
  'difficulty',
  'title',
  'estimatedSolveTime',
  'platform',
  'recent',
] as const;
export type ProblemSortField = (typeof PROBLEM_SORT_FIELDS)[number];
