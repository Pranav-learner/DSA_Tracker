import { DECAY_CONFIG } from '../config/retention.js';
import { daysUntil } from './revision.util.js';

/**
 * DecayStrategy — the pluggable "forgetting curve". Confidence-decay MATH lives
 * behind this interface (never hardcoded), so AI-based strategies can register
 * later with no schema change. All strategies read their parameters from config.
 */
export interface DecayInput {
  confidenceScore: number;
  reviewCount: number;
  /** Reference moment for decay (last decay, else last review, else creation). */
  sinceDate: Date;
  now: Date;
}

export interface DecayResult {
  confidenceScore: number;
  decayScore: number; // current daily decay rate (points/day)
  daysDecayed: number;
}

export interface DecayStrategy {
  name: string;
  dailyRate(reviewCount: number): number;
  applyDecay(input: DecayInput): DecayResult;
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * DefaultDecayStrategy — a review-damped daily decay: the more times an entity has
 * been reviewed, the slower it forgets (bounded below by `minDailyDecay`).
 */
export function createDefaultDecayStrategy(config = DECAY_CONFIG): DecayStrategy {
  return {
    name: 'default',
    dailyRate(reviewCount) {
      const rate = config.baseDailyDecay / (1 + reviewCount * config.reviewDamping);
      return Math.max(config.minDailyDecay, rate);
    },
    applyDecay(input) {
      const days = Math.max(0, daysUntil(input.now, input.sinceDate)); // whole days since → now
      const rate = this.dailyRate(input.reviewCount);
      return {
        confidenceScore: Math.round(clamp(input.confidenceScore - rate * days)),
        decayScore: round1(rate),
        daysDecayed: days,
      };
    },
  };
}

export const DefaultDecayStrategy = createDefaultDecayStrategy();

const REGISTRY: Record<string, DecayStrategy> = { default: DefaultDecayStrategy };

export function getDecayStrategy(name?: string): DecayStrategy {
  return (name && REGISTRY[name]) || DefaultDecayStrategy;
}

export function registerDecayStrategy(strategy: DecayStrategy): void {
  REGISTRY[strategy.name] = strategy;
}
