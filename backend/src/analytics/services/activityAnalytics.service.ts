import { analyticsRepository } from '../repositories/analytics.repository.js';
import type { AnalyticsWindow } from '../types/analytics.types.js';
import type { ActivitySummaryDTO, TimePointDTO } from '../dto/analytics.dto.js';

const DAY_MS = 86_400_000;

/** Parse a 'YYYY-MM-DD' key to a UTC-midnight epoch. */
function keyToEpoch(key: string): number {
  return Date.parse(`${key}T00:00:00Z`);
}

/** The Monday-of-week key for a 'YYYY-MM-DD' date (week bucket label). */
function weekKey(key: string): string {
  const d = new Date(keyToEpoch(key));
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  const monday = new Date(d.getTime() - dow * DAY_MS);
  return monday.toISOString().slice(0, 10);
}

/** Sum {date,count} points into buckets keyed by `keyFn`, ascending. */
function bucket(points: TimePointDTO[], keyFn: (date: string) => string): TimePointDTO[] {
  const map = new Map<string, number>();
  for (const p of points) {
    const k = keyFn(p.date);
    map.set(k, (map.get(k) ?? 0) + p.count);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count }));
}

/** Longest & current consecutive-day streaks from ascending day-keys. */
function streaks(dayKeys: string[], now: number): { current: number; longest: number } {
  if (dayKeys.length === 0) return { current: 0, longest: 0 };
  const epochs = dayKeys.map(keyToEpoch);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < epochs.length; i += 1) {
    const gap = Math.round((epochs[i] - epochs[i - 1]) / DAY_MS);
    run = gap === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  // Current streak counts back from today (or yesterday, to survive "not yet today").
  const todayKey = new Date(now).toISOString().slice(0, 10);
  const todayEpoch = keyToEpoch(todayKey);
  const last = epochs[epochs.length - 1];
  const lastGap = Math.round((todayEpoch - last) / DAY_MS);
  let current = 0;
  if (lastGap <= 1) {
    current = 1;
    for (let i = epochs.length - 1; i > 0; i -= 1) {
      const gap = Math.round((epochs[i] - epochs[i - 1]) / DAY_MS);
      if (gap === 1) current += 1;
      else break;
    }
  }
  return { current, longest };
}

/**
 * ActivityAnalyticsService — activity-engine metrics. Aggregates the Activity
 * feed into daily/weekly/monthly buckets and computes learning streaks. Daily
 * buckets respect the window; streaks use all-time history for correctness.
 */
export const activityAnalyticsService = {
  async summary(userId: string, window: AnalyticsWindow): Promise<ActivitySummaryDTO> {
    const [daily, allDayKeys] = await Promise.all([
      analyticsRepository.activityDaily(userId, window.from),
      analyticsRepository.activityDayKeys(userId),
    ]);

    const { current, longest } = streaks(allDayKeys, Date.now());

    return {
      totalActivities: daily.reduce((s, p) => s + p.count, 0),
      activeDays: daily.length,
      currentStreak: current,
      longestStreak: longest,
      dailyActivity: daily,
      weeklyActivity: bucket(daily, weekKey),
      monthlyActivity: bucket(daily, (d) => d.slice(0, 7)),
    };
  },
};
