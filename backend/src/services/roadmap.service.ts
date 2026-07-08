import { phaseService } from './phase.service.js';
import type { PhaseDTO } from './mappers.js';
import type { Progress } from '../types/domain.js';

export interface RoadmapDTO {
  phases: PhaseDTO[];
  stats: {
    totalPhases: number;
    unlockedPhases: number;
    completedPhases: number;
    totalTopics: number;
    totalEstimatedWeeks: number;
    totalEstimatedProblems: number;
  };
  /** Overall roadmap progress placeholder (mastery engine fills this later). */
  progress: Progress;
}

/**
 * Roadmap service — aggregates the whole roadmap into a single response used
 * by the roadmap page and dashboard preview.
 */
export const roadmapService = {
  async get(): Promise<RoadmapDTO> {
    const phases = await phaseService.list();

    const totalTopics = phases.reduce((sum, p) => sum + p.topicCount, 0);
    const totalEstimatedProblems = phases.reduce((sum, p) => sum + p.estimatedProblems, 0);

    return {
      phases,
      stats: {
        totalPhases: phases.length,
        unlockedPhases: phases.filter((p) => p.isUnlocked).length,
        completedPhases: phases.filter((p) => p.isCompleted).length,
        totalTopics,
        totalEstimatedWeeks: phases.reduce((sum, p) => sum + p.estimatedWeeks, 0),
        totalEstimatedProblems,
      },
      progress: {
        completedTopics: 0,
        totalTopics,
        completedProblems: 0,
        totalProblems: totalEstimatedProblems,
        percent: 0,
      },
    };
  },
};
