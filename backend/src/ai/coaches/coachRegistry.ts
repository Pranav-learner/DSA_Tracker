import type { Coach } from './types.js';
import type { AiIntent } from '../types/ai.types.js';

/**
 * CoachRegistry (Module 7 · Sprint 3). A registry-pattern container: coaches
 * register themselves and are resolved by intent at request time — NO switch
 * statements anywhere. New coaches (or future plugins) just call `register`; the
 * router and API pick them up automatically. Resolution is first-match-wins in
 * registration order, so the fallback coach (Study) is registered last and only
 * claims the catch-all intents.
 */
export class CoachRegistry {
  private readonly byId = new Map<string, Coach>();

  /** Register a coach (idempotent by id). */
  register(coach: Coach): this {
    this.byId.set(coach.id, coach);
    return this;
  }

  /** A coach by its stable id. */
  get(id: string): Coach | undefined {
    return this.byId.get(id);
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }

  /** The first registered coach that supports the intent. */
  resolveByIntent(intent: AiIntent): Coach | undefined {
    for (const coach of this.byId.values()) {
      if (coach.supports(intent)) return coach;
    }
    return undefined;
  }

  /**
   * Resolve a coach for a request: prefer an explicit coachId, else the intent,
   * else the fallback coach. Returns undefined only if the registry is empty.
   */
  resolve(opts: { coachId?: string; intent?: AiIntent }, fallbackId = 'study'): Coach | undefined {
    if (opts.coachId) return this.get(opts.coachId);
    if (opts.intent) {
      const byIntent = this.resolveByIntent(opts.intent);
      if (byIntent) return byIntent;
    }
    return this.get(fallbackId) ?? this.all()[0];
  }

  /** Every registered coach. */
  all(): Coach[] {
    return [...this.byId.values()];
  }

  /** All intents any coach can serve. */
  supportedIntents(): AiIntent[] {
    const set = new Set<AiIntent>();
    for (const c of this.byId.values()) for (const i of c.meta().supportedIntents) set.add(i);
    return [...set];
  }
}

/** The process-wide coach registry (populated in coaches/index.ts). */
export const coachRegistry = new CoachRegistry();
