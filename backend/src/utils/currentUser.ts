import type { Request } from 'express';
import { env } from '../config/env.js';

/**
 * Resolves the acting user. Sprint 3 is single-user (auth is a later sprint),
 * so this returns the configured demo user. When auth lands, this is the ONLY
 * place that changes — everything downstream already threads a userId.
 */
export function currentUserId(_req: Request): string {
  return env.demoUserId;
}
