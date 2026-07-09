import { MASTERY_METRICS, type MasteryWeights } from '../types/domain.js';

/**
 * Central, configurable tuning for the Learning Engine.
 *
 * Weights and thresholds live here (not in services or controllers) so the whole
 * mastery model can be retuned in one place. Weights sum to 1.0; every service
 * that needs them imports from here or accepts an override argument.
 */
export const DEFAULT_MASTERY_WEIGHTS: MasteryWeights = {
  recognition: 0.2,
  implementation: 0.2,
  standard: 0.15,
  variant: 0.15,
  mixed: 0.1,
  contest: 0.1,
  assessment: 0.05,
  confidence: 0.05,
};

/** Fails fast in dev if the weights are misconfigured. */
export function assertWeightsValid(weights: MasteryWeights = DEFAULT_MASTERY_WEIGHTS): void {
  const sum = MASTERY_METRICS.reduce((acc, m) => acc + (weights[m] ?? 0), 0);
  if (Math.abs(sum - 1) > 1e-6) {
    throw new Error(`Mastery weights must sum to 1 (got ${sum.toFixed(4)})`);
  }
}

export const MASTERY_THRESHOLDS = {
  /** Overall mastery (+ passed assessment) for a topic to be "Completed". */
  completion: 75,
  /** Overall mastery (+ passed assessment) for a topic to be "Mastered". */
  mastered: 90,
  /** Previous topic's mastery required to unlock the next topic. */
  unlock: 70,
  /** Assessment score considered a pass. */
  assessmentPass: 70,
  /** A ladder stage's metric score at which the stage is "completed". */
  stageComplete: 70,
  /** Average phase mastery required (with all topics done) to complete a phase. */
  phaseCompletion: 75,
} as const;

export type MasteryThresholds = typeof MASTERY_THRESHOLDS;
