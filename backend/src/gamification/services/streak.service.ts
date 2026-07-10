import { STREAK_CONFIG } from '../../config/gamification.js';

const DAY_MS = 86_400_000;

/** UTC-midnight epoch for a date (day-granularity comparisons). */
function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** The snapshot the streak calc needs — the persisted streak fields. */
export interface StreakSnapshot {
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  lastActivityDate: Date | null;
}

/** What kind of transition a meaningful activity caused. */
export type StreakTransition = 'started' | 'increased' | 'continued-same-day' | 'broken';

export interface StreakAdvance {
  /** The new persisted streak fields. */
  fields: {
    currentStreak: number;
    longestStreak: number;
    totalDaysActive: number;
    lastActivityDate: Date;
  };
  transition: StreakTransition;
  /** True when this activity fell on a *new* calendar day (day count advanced). */
  isNewDay: boolean;
}

/**
 * StreakService — the daily-activity streak math. Pure and DB-free: it takes the
 * previous snapshot plus the moment a *meaningful* activity occurred and returns
 * the next snapshot. "Meaningful" is enforced upstream — only rewardable
 * activities reach the engine, so only they can move a streak (a day with no
 * learning/revision/contest/knowledge activity never counts).
 *
 * Rules (grace window = `STREAK_CONFIG.graceDays`, default 1):
 *   • first ever activity        → streak starts at 1.
 *   • same UTC day as last       → no change (already counted today).
 *   • exactly next day (≤ grace) → streak +1 (continued / recovered).
 *   • larger gap                 → streak resets to 1 (broken).
 * `longestStreak` only ever ratchets up; `totalDaysActive` counts distinct days.
 */
export const streakService = {
  advance(snapshot: StreakSnapshot, occurredAt: Date): StreakAdvance {
    const today = startOfUtcDay(occurredAt);
    const { currentStreak, longestStreak, totalDaysActive, lastActivityDate } = snapshot;

    // First activity ever.
    if (!lastActivityDate) {
      return this.result(1, Math.max(longestStreak, 1), totalDaysActive + 1, occurredAt, 'started', true);
    }

    const last = startOfUtcDay(lastActivityDate);
    const gapDays = Math.round((today - last) / DAY_MS);

    // Same day (or a backdated/out-of-order event) — already counted.
    if (gapDays <= 0) {
      return this.result(
        Math.max(currentStreak, 1),
        Math.max(longestStreak, currentStreak),
        totalDaysActive,
        // Keep the latest timestamp so "last active" reflects reality.
        gapDays === 0 && occurredAt > lastActivityDate ? occurredAt : lastActivityDate,
        'continued-same-day',
        false,
      );
    }

    // Within the grace window — the streak continues (or recovers).
    if (gapDays <= STREAK_CONFIG.graceDays) {
      const next = currentStreak + 1;
      return this.result(next, Math.max(longestStreak, next), totalDaysActive + 1, occurredAt, 'increased', true);
    }

    // Gap too large — streak broke; a new one begins at 1.
    return this.result(1, Math.max(longestStreak, currentStreak), totalDaysActive + 1, occurredAt, 'broken', true);
  },

  result(
    currentStreak: number,
    longestStreak: number,
    totalDaysActive: number,
    lastActivityDate: Date,
    transition: StreakTransition,
    isNewDay: boolean,
  ): StreakAdvance {
    return {
      fields: { currentStreak, longestStreak, totalDaysActive, lastActivityDate },
      transition,
      isNewDay,
    };
  },

  /**
   * Whether a stored streak is still "live" as of `now` — i.e. the last activity
   * was today or within the grace window. Used by read endpoints so a stale
   * streak isn't reported as active after a missed day (streaks never silently
   * drift; they are re-evaluated at read time).
   */
  isActive(lastActivityDate: Date | null, now: Date): boolean {
    if (!lastActivityDate) return false;
    const gap = Math.round((startOfUtcDay(now) - startOfUtcDay(lastActivityDate)) / DAY_MS);
    return gap >= 0 && gap <= STREAK_CONFIG.graceDays;
  },

  /** The live current streak as of `now` (0 if the grace window has lapsed). */
  effectiveCurrent(snapshot: StreakSnapshot, now: Date): number {
    return this.isActive(snapshot.lastActivityDate, now) ? snapshot.currentStreak : 0;
  },
};
