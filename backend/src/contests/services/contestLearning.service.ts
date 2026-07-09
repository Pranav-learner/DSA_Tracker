import { upsolveService } from './upsolve.service.js';
import { upsolveTaskRepository } from '../repositories/upsolveTask.repository.js';
import { postmortemService } from './postmortem.service.js';
import { contestProblemRepository } from '../repositories/contestProblem.repository.js';
import { requireOwnedContest } from './contest.service.js';
import { patternIntelligenceService } from '../../analytics/services/patternIntelligence.service.js';
import { resolveAnalyticsWindow } from '../../analytics/validators/analytics.validator.js';
import type { ContestProblemDocument } from '../../models/ContestProblem.js';
import type { WeaknessDTO } from '../../analytics/dto/intelligence.dto.js';
import type {
  AlgorithmGapDTO,
  ContestLearningDTO,
  ContestPatternAnalysisDTO,
  UpsolveTaskDTO,
} from '../dto/learning.dto.js';

/** A problem's coarse "pattern" label (tag → difficulty → code fallback). */
function patternOf(p: ContestProblemDocument): string {
  return p.tags[0] || (p.difficulty ? `Difficulty ${p.difficulty}` : p.index || p.problemCode);
}

function uniq(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

/**
 * ContestLearningService — orchestrates the post-contest learning experience:
 * generates the upsolve queue from unsolved problems and composes the learning
 * workspace (postmortem + upsolve + pattern/algorithm analysis + goals). Pattern
 * analysis REUSES Module 4's Pattern Intelligence; it invents no analytics.
 */
export const contestLearningService = {
  /** Auto-generate upsolve tasks for every unsolved problem (idempotent). */
  async generateUpsolveTasks(userId: string, contestId: string): Promise<UpsolveTaskDTO[]> {
    await requireOwnedContest(userId, contestId);
    const problems = await contestProblemRepository.findByContest(userId, contestId);
    const unsolved = problems.filter((p) => !p.solved);

    let created = 0;
    for (const p of unsolved) {
      const existing = await upsolveTaskRepository.findByProblem(userId, String(p._id));
      if (existing) continue;
      await upsolveService.createForProblem(userId, contestId, { contestProblemRef: String(p._id) });
      created += 1;
    }
    void created;
    return upsolveService.list(userId, { contestId });
  },

  patternAnalysis(problems: ContestProblemDocument[], weaknesses: WeaknessDTO[]): ContestPatternAnalysisDTO {
    const solved = problems.filter((p) => p.solved);
    const missed = problems.filter((p) => !p.solved);
    return {
      patternsSolved: uniq(solved.map(patternOf)),
      patternsMissed: uniq(missed.map(patternOf)),
      patternsToPractice: weaknesses.slice(0, 5).map((w) => ({ pattern: w.title, topicId: w.entityId, reason: w.recommendationHint })),
    };
  },

  algorithmGaps(problems: ContestProblemDocument[], weaknesses: WeaknessDTO[]): AlgorithmGapDTO[] {
    const fromProblems: AlgorithmGapDTO[] = problems
      .filter((p) => !p.solved && (p.attempted || p.attempts > 0 || p.skipped))
      .slice(0, 4)
      .map((p) => ({
        label: p.problemName,
        detail: `Unsolved ${p.difficulty ? `(${p.difficulty})` : ''} — ${p.attempts} attempt${p.attempts === 1 ? '' : 's'}`.trim(),
        topicId: null,
        severity: p.attempted || p.attempts > 0 ? 'high' : 'medium',
      }));
    const fromWeaknesses: AlgorithmGapDTO[] = weaknesses
      .filter((w) => w.category === 'low-mastery' || w.category === 'knowledge-gap' || w.category === 'high-failure-rate')
      .slice(0, 3)
      .map((w) => ({ label: w.title, detail: w.detail, topicId: w.entityId, severity: w.severity }));
    return [...fromProblems, ...fromWeaknesses];
  },

  suggestedGoals(weaknesses: WeaknessDTO[]): string[] {
    const goals = weaknesses.slice(0, 4).map((w) => w.recommendationHint);
    if (goals.length < 3) goals.push('Upsolve every unsolved problem within 48 hours.');
    return [...new Set(goals)];
  },

  /** The complete Contest Learning workspace payload. */
  async getLearning(userId: string, contestId: string): Promise<ContestLearningDTO> {
    await requireOwnedContest(userId, contestId);
    const window = resolveAnalyticsWindow({ range: '30d' });
    const [problems, postmortem, upsolve, weaknesses] = await Promise.all([
      contestProblemRepository.findByContest(userId, contestId),
      postmortemService.getByContest(userId, contestId),
      upsolveService.list(userId, { contestId }),
      patternIntelligenceService.weaknesses(userId, window),
    ]);

    return {
      contestRef: contestId,
      postmortem,
      upsolve,
      patternAnalysis: this.patternAnalysis(problems, weaknesses),
      algorithmGaps: this.algorithmGaps(problems, weaknesses),
      suggestedLearningGoals: this.suggestedGoals(weaknesses),
    };
  },
};
