import type { PhaseDocument } from '../models/Phase.js';
import type { TopicDocument } from '../models/Topic.js';
import {
  emptyProgress,
  type ConceptExample,
  type Difficulty,
  type Platform,
  type Progress,
} from '../types/domain.js';

/** Serialised Phase as returned by the API. */
export interface PhaseDTO {
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
  createdAt: Date;
  updatedAt: Date;
}

/** Serialised Topic as returned by the API. */
export interface TopicDTO {
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
  createdAt: Date;
  updatedAt: Date;
}

export function toPhaseDTO(phase: PhaseDocument, topicCount = 0): PhaseDTO {
  return {
    id: String(phase._id),
    title: phase.title,
    slug: phase.slug,
    order: phase.order,
    description: phase.description,
    icon: phase.icon,
    estimatedWeeks: phase.estimatedWeeks,
    estimatedProblems: phase.estimatedProblems,
    color: phase.color,
    isUnlocked: phase.isUnlocked,
    isCompleted: phase.isCompleted,
    topicCount,
    // Progress is a placeholder in Sprint 1 — mastery engine fills this later.
    progress: emptyProgress(topicCount, phase.estimatedProblems),
    createdAt: phase.createdAt,
    updatedAt: phase.updatedAt,
  };
}

export function toTopicDTO(topic: TopicDocument): TopicDTO {
  return {
    id: String(topic._id),
    phaseId: String(topic.phaseId),
    title: topic.title,
    slug: topic.slug,
    description: topic.description,
    order: topic.order,
    estimatedHours: topic.estimatedHours,
    estimatedProblems: topic.estimatedProblems,
    difficulty: topic.difficulty as Difficulty,
    isUnlocked: topic.isUnlocked,
    isCompleted: topic.isCompleted,
    createdAt: topic.createdAt,
    updatedAt: topic.updatedAt,
  };
}

/* ------------------------------------------------------------------ *
 *  Sprint 2 — Topic Workspace DTOs
 * ------------------------------------------------------------------ */

/** Lightweight topic reference used for navigation, relations & prerequisites. */
export interface TopicSummaryDTO {
  id: string;
  title: string;
  slug: string;
  phaseId: string;
  order: number;
  difficulty: Difficulty;
  estimatedHours: number;
  estimatedProblems: number;
  isUnlocked: boolean;
  isCompleted: boolean;
}

/** Minimal phase reference embedded in the topic detail (for the header). */
export interface PhaseRefDTO {
  id: string;
  title: string;
  order: number;
  slug: string;
  color: string;
  icon: string;
}

export interface ConceptDTO {
  coreIdea: string;
  whenToUse: string;
  whenNotToUse: string;
  timeComplexity: string;
  spaceComplexity: string;
  advantages: string[];
  limitations: string[];
  applications: string[];
  examples: ConceptExample[];
}

export interface RepresentativeProblemDTO {
  id: string;
  name: string;
  platform: Platform;
  difficulty: Difficulty;
  pattern: string;
  url?: string;
  estimatedMinutes: number;
  /** Placeholder — real tracking arrives with the Problem Tracker sprint. */
  status: 'Not Started';
}

export interface TopicNavigationDTO {
  previous: TopicSummaryDTO | null;
  next: TopicSummaryDTO | null;
}

/** Full topic detail returned by GET /topics/:id — powers the workspace. */
export interface TopicDetailDTO extends TopicDTO {
  concept: ConceptDTO;
  recognitionKeywords: string[];
  prerequisites: string[];
  relatedTopics: string[];
  representativeProblemCount: number;
  phase: PhaseRefDTO;
  navigation: TopicNavigationDTO;
}

export function toTopicSummaryDTO(topic: TopicDocument): TopicSummaryDTO {
  return {
    id: String(topic._id),
    title: topic.title,
    slug: topic.slug,
    phaseId: String(topic.phaseId),
    order: topic.order,
    difficulty: topic.difficulty as Difficulty,
    estimatedHours: topic.estimatedHours,
    estimatedProblems: topic.estimatedProblems,
    isUnlocked: topic.isUnlocked,
    isCompleted: topic.isCompleted,
  };
}

export function toPhaseRefDTO(phase: PhaseDocument): PhaseRefDTO {
  return {
    id: String(phase._id),
    title: phase.title,
    order: phase.order,
    slug: phase.slug,
    color: phase.color,
    icon: phase.icon,
  };
}

export function toRepresentativeProblemDTO(
  problem: TopicDocument['representativeProblems'][number],
): RepresentativeProblemDTO {
  return {
    id: String((problem as { _id?: unknown })._id ?? ''),
    name: problem.name,
    platform: problem.platform as Platform,
    difficulty: problem.difficulty as Difficulty,
    pattern: problem.pattern,
    url: problem.url,
    estimatedMinutes: problem.estimatedMinutes,
    status: 'Not Started',
  };
}

export function toTopicDetailDTO(
  topic: TopicDocument,
  phase: PhaseDocument,
  navigation: TopicNavigationDTO,
): TopicDetailDTO {
  return {
    ...toTopicDTO(topic),
    concept: {
      coreIdea: topic.coreIdea,
      whenToUse: topic.whenToUse,
      whenNotToUse: topic.whenNotToUse,
      timeComplexity: topic.timeComplexity,
      spaceComplexity: topic.spaceComplexity,
      advantages: topic.advantages,
      limitations: topic.limitations,
      applications: topic.applications,
      examples: topic.examples,
    },
    recognitionKeywords: topic.recognitionKeywords,
    prerequisites: topic.prerequisites,
    relatedTopics: topic.relatedTopics,
    representativeProblemCount: topic.representativeProblems.length,
    phase: toPhaseRefDTO(phase),
    navigation,
  };
}
