import { DEFAULT_REVISION_INTERVALS, DEFAULT_EASE_FACTOR } from '../config/revision.js';
import { addDays } from './revision.util.js';

/**
 * RevisionStrategy — the pluggable scheduling brain. Scheduling MATH lives behind
 * this interface (never hardcoded in services), so SM-2 / AI strategies can be
 * registered later with no schema change. All strategies read their spacing from
 * config, keeping the values configurable in one place.
 */
export interface InitialSchedule {
  currentInterval: number;
  nextReviewDate: Date;
  easeFactor: number;
  priority?: number;
}

export interface NextReview {
  currentInterval: number;
  nextReviewDate: Date;
  easeFactor: number;
  reviewCount: number;
}

export interface RevisionStrategy {
  name: string;
  intervals: readonly number[];
  /** The very first schedule, from the creation moment. */
  initialSchedule(from: Date): InitialSchedule;
  /** The next schedule after a review completes (advance through the intervals). */
  nextReview(state: { reviewCount: number; easeFactor: number }, from: Date): NextReview;
}

/**
 * DefaultRevisionStrategy — expanding fixed intervals (1 → 3 → 7 → 14 → 30 → 60
 * → 90 days, then repeats the last). Interval list is configurable.
 */
export function createDefaultRevisionStrategy(
  intervals: readonly number[] = DEFAULT_REVISION_INTERVALS,
): RevisionStrategy {
  return {
    name: 'default',
    intervals,
    initialSchedule(from) {
      const interval = intervals[0];
      return { currentInterval: interval, nextReviewDate: addDays(from, interval), easeFactor: DEFAULT_EASE_FACTOR };
    },
    nextReview(state, from) {
      const reviewCount = state.reviewCount + 1;
      const interval = intervals[Math.min(reviewCount, intervals.length - 1)];
      return { currentInterval: interval, nextReviewDate: addDays(from, interval), easeFactor: state.easeFactor, reviewCount };
    },
  };
}

export const DefaultRevisionStrategy = createDefaultRevisionStrategy();

const REGISTRY: Record<string, RevisionStrategy> = {
  default: DefaultRevisionStrategy,
};

/** Resolve a strategy by name, falling back to the default. */
export function getRevisionStrategy(name?: string): RevisionStrategy {
  return (name && REGISTRY[name]) || DefaultRevisionStrategy;
}

/** Register a future strategy (SM-2, AI). */
export function registerRevisionStrategy(strategy: RevisionStrategy): void {
  REGISTRY[strategy.name] = strategy;
}
