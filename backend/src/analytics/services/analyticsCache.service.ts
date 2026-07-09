import { ANALYTICS_CACHE_ENABLED } from '../../config/analytics.js';
import { logger } from '../../utils/logger.js';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
  /** Freshness token — a monotonic per-user signal (latest activity time). */
  token: number;
  computedAt: number;
}

/**
 * AnalyticsCacheService — a lightweight in-memory TTL cache for expensive
 * analytics aggregations. Redis is not configured in this project, so this is a
 * process-local Map with the same contract (get/set/wrap/invalidate) — swap the
 * backing store for Redis later with no call-site change.
 *
 * Invalidation is twofold and NON-INVASIVE:
 *   1. TTL expiry (configurable per scope).
 *   2. A per-user *freshness token* (the latest Activity timestamp). Because
 *      every meaningful mutation — problem solved, revision completed, knowledge
 *      updated, mastery/progress change — records an Activity event, a changed
 *      token busts the cache automatically. No completed module is modified.
 */
class AnalyticsCache {
  private store = new Map<string, CacheEntry>();

  /** Uses a fresh in-process reference clock (Date is unavailable in some ctx). */
  private now(): number {
    return Date.now();
  }

  get<T>(key: string, token: number): T | undefined {
    if (!ANALYTICS_CACHE_ENABLED) return undefined;
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.token !== token || entry.expiresAt <= this.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set(key: string, value: unknown, ttlMs: number, token: number): void {
    if (!ANALYTICS_CACHE_ENABLED) return;
    this.store.set(key, { value, token, expiresAt: this.now() + ttlMs, computedAt: this.now() });
  }

  /** Get-or-compute: returns the cached value when fresh, else runs `producer`. */
  async wrap<T>(key: string, ttlMs: number, token: number, producer: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key, token);
    if (cached !== undefined) return cached;
    const value = await producer();
    this.set(key, value, ttlMs, token);
    return value;
  }

  /** Drop every entry for a user (explicit invalidation hook). */
  invalidateUser(userId: string): void {
    let dropped = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.store.delete(key);
        dropped += 1;
      }
    }
    if (dropped > 0) logger.debug(`Analytics cache: invalidated ${dropped} entries for ${userId}`);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

export const analyticsCacheService = new AnalyticsCache();
