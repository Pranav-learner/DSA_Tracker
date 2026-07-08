import type { PhaseDocument } from '../models/Phase.js';
import type { TopicDocument } from '../models/Topic.js';
import { emptyProgress, type Difficulty, type Progress } from '../types/domain.js';

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
