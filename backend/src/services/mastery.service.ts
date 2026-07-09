import { DEFAULT_MASTERY_WEIGHTS, MASTERY_THRESHOLDS } from '../config/mastery.js';
import {
  LADDER_STAGES,
  MASTERY_METRICS,
  isCompletedStatus,
  type LadderStage,
  type MasteryMetrics,
  type MasteryWeights,
  type TopicProgressStatus,
} from '../types/domain.js';
import type { TopicProgressDocument } from '../models/TopicProgress.js';
import type { LadderStageDTO } from './learning.dto.js';

export const ZERO_METRICS: MasteryMetrics = {
  recognition: 0,
  implementation: 0,
  standard: 0,
  variant: 0,
  mixed: 0,
  contest: 0,
  assessment: 0,
  confidence: 0,
};

/**
 * MasteryService — pure, stateless mastery mathematics. Holds NO database
 * access; every controller/service that needs mastery numbers computes them
 * here so the model lives in exactly one place.
 */
export const masteryService = {
  /** Extract the eight metrics from a progress document (or zeros). */
  metricsOf(doc: TopicProgressDocument | null | undefined): MasteryMetrics {
    if (!doc) return { ...ZERO_METRICS };
    return {
      recognition: doc.recognitionScore,
      implementation: doc.implementationScore,
      standard: doc.standardScore,
      variant: doc.variantScore,
      mixed: doc.mixedScore,
      contest: doc.contestScore,
      assessment: doc.assessmentScore,
      confidence: doc.confidence,
    };
  },

  /** Map a partial metrics patch to TopicProgress score fields. */
  metricsToScores(metrics: Partial<MasteryMetrics>): Record<string, number> {
    const out: Record<string, number> = {};
    if (metrics.recognition !== undefined) out.recognitionScore = clamp(metrics.recognition);
    if (metrics.implementation !== undefined) out.implementationScore = clamp(metrics.implementation);
    if (metrics.standard !== undefined) out.standardScore = clamp(metrics.standard);
    if (metrics.variant !== undefined) out.variantScore = clamp(metrics.variant);
    if (metrics.mixed !== undefined) out.mixedScore = clamp(metrics.mixed);
    if (metrics.contest !== undefined) out.contestScore = clamp(metrics.contest);
    if (metrics.assessment !== undefined) out.assessmentScore = clamp(metrics.assessment);
    if (metrics.confidence !== undefined) out.confidence = clamp(metrics.confidence);
    return out;
  },

  /** Weighted overall mastery (0–100), rounded. */
  computeOverall(metrics: MasteryMetrics, weights: MasteryWeights = DEFAULT_MASTERY_WEIGHTS): number {
    const total = MASTERY_METRICS.reduce((acc, m) => acc + metrics[m] * (weights[m] ?? 0), 0);
    return Math.round(clamp(total));
  },

  assessmentPassed(metrics: MasteryMetrics): boolean {
    return metrics.assessment >= MASTERY_THRESHOLDS.assessmentPass;
  },

  /** Derive a topic's status from its mastery, assessment and activity. */
  deriveStatus(
    overall: number,
    metrics: MasteryMetrics,
    threshold: number = MASTERY_THRESHOLDS.completion,
  ): TopicProgressStatus {
    const started = MASTERY_METRICS.some((m) => metrics[m] > 0);
    if (!started) return 'Not Started';
    const passed = this.assessmentPassed(metrics);
    if (overall >= MASTERY_THRESHOLDS.mastered && passed) return 'Mastered';
    if (overall >= threshold && passed) return 'Completed';
    return 'In Progress';
  },

  /** The stage the learner is actively on: first unlocked, incomplete stage. */
  currentStage(metrics: MasteryMetrics): LadderStage {
    let prevCompleted = true;
    for (const stage of LADDER_STAGES) {
      const completed = metrics[stage] >= MASTERY_THRESHOLDS.stageComplete;
      const unlocked = prevCompleted;
      if (unlocked && !completed) return stage;
      prevCompleted = completed;
    }
    return LADDER_STAGES[LADDER_STAGES.length - 1];
  },

  /** Build the six-stage ladder (progress + locked/completed + timestamps). */
  deriveLadder(
    metrics: MasteryMetrics,
    doc?: TopicProgressDocument | null,
  ): LadderStageDTO[] {
    const startedAt = doc?.startedAt ? doc.startedAt.toISOString() : null;
    const completedAt = doc?.completedAt
      ? doc.completedAt.toISOString()
      : doc?.lastStudied
        ? doc.lastStudied.toISOString()
        : null;

    let prevCompleted = true;
    return LADDER_STAGES.map((stage) => {
      const progress = metrics[stage];
      const completed = progress >= MASTERY_THRESHOLDS.stageComplete;
      const unlocked = prevCompleted;
      const dto: LadderStageDTO = {
        stage,
        progress,
        completed,
        unlocked,
        startedAt: progress > 0 ? startedAt : null,
        completedAt: completed ? completedAt : null,
      };
      prevCompleted = completed;
      return dto;
    });
  },

  /** Convenience: is this topic's status "done" (Completed or Mastered)? */
  isDone(status: TopicProgressStatus): boolean {
    return isCompletedStatus(status);
  },
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}
