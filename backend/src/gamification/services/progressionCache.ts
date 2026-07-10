/**
 * A tiny per-user TTL cache for the progression summary. The summary is read on
 * every dashboard load but changes only when the Reward Engine awards XP, so we
 * memoise it briefly and invalidate on award. Kept in-process and dependency-free
 * (swap for Redis in a multi-instance deployment — a documented extension point).
 */
interface Entry<T> {
  value: T;
  expiresAt: number;
}

const TTL_MS = 30_000;

export class TtlCache<T> {
  private readonly store = new Map<string, Entry<T>>();

  constructor(private readonly ttlMs = TTL_MS) {}

  get(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

/** Shared cache instance for progression summaries (keyed by userId). */
export const progressionCache = new TtlCache<unknown>();
