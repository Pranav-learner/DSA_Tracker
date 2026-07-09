import type { Difficulty, Platform } from '../types/domain.js';
import type { PhaseRefDTO } from './mappers.js';
import type { TopicRefDTO } from './problem.dto.js';
import type { INotebookAlternative } from '../models/NotebookEntry.js';

/* Module 2 · Sprint 3 — Pattern Notebook response DTOs. */

export type NotebookAlternativeDTO = INotebookAlternative;

/** A lightweight related-problem ref shown on the workspace. */
export interface RelatedProblemRefDTO {
  id: string;
  title: string;
  slug: string;
  pattern: string;
  difficulty: Difficulty;
  platform: Platform;
  topicId: string;
  topicTitle: string;
}

/** A lightweight related-notebook ref (for knowledge links). */
export interface NotebookRefDTO {
  id: string;
  problemId: string;
  title: string;
  pattern: string;
  confidence: number;
}

/** A notebook entry as it appears in the searchable index/list. */
export interface NotebookListItemDTO {
  id: string;
  problemId: string;
  topicId: string;
  phaseId: string;
  title: string;
  pattern: string;
  platform: Platform;
  topicTitle: string;
  confidence: number;
  revisionCount: number;
  relatedCount: number;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Full notebook entry with resolved relationships (workspace payload). */
export interface NotebookDetailDTO {
  id: string;
  userId: string;
  problemId: string;
  topicId: string;
  phaseId: string;
  title: string;
  platform: Platform;
  pattern: string;
  recognitionKeywords: string[];
  observation: string;
  coreAlgorithm: string;
  timeComplexity: string;
  spaceComplexity: string;
  alternativeSolutions: NotebookAlternativeDTO[];
  commonMistakes: string[];
  lessonsLearned: string;
  personalNotes: string;
  confidence: number;
  revisionDates: string[];
  revisionCount: number;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Resolved refs (raw id arrays are collapsed into these).
  topic: TopicRefDTO | null;
  phase: PhaseRefDTO | null;
  relatedProblems: RelatedProblemRefDTO[];
  relatedEntries: NotebookRefDTO[];
}

/** Available filter values, so the client's filters stay data-driven. */
export interface NotebookFacetsDTO {
  patterns: string[];
  platforms: Platform[];
}

/** Raw knowledge counts for the dashboard's Knowledge Summary (Module 2 owned). */
export interface KnowledgeStatsDTO {
  knowledgeEntries: number;
  patternsLearned: number;
  topicsCovered: number;
  representativeProblems: number;
}

export const NOTEBOOK_SORT_FIELDS = ['recent', 'confidence', 'reviewed', 'alpha'] as const;
export type NotebookSortField = (typeof NOTEBOOK_SORT_FIELDS)[number];

/** Normalised, validated query for the notebook list/search. */
export interface NotebookQuery {
  page: number;
  pageSize: number;
  q?: string;
  pattern?: string;
  topic?: string;
  phase?: string;
  platform?: Platform;
  problem?: string;
  tag?: string;
  confidenceMin?: number;
  confidenceMax?: number;
  sort: NotebookSortField;
  order: 'asc' | 'desc';
}
