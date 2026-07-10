import type { Request, Response, NextFunction } from 'express';
import { AI_RATE_LIMIT } from '../../config/ai.js';
import { currentUserId } from '../../utils/currentUser.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * A tiny in-memory sliding-window rate limiter for the AI endpoints (per user).
 * AI calls are expensive/abusable, so they get their own limiter separate from
 * the rest of the API. In-process is fine for single-instance; swap for Redis in
 * a multi-instance deployment (documented extension point).
 */
const hits = new Map<string, number[]>();

export function aiRateLimit(req: Request, _res: Response, next: NextFunction): void {
  const userId = currentUserId(req);
  const now = Date.now();
  const windowStart = now - AI_RATE_LIMIT.windowMs;

  const recent = (hits.get(userId) ?? []).filter((t) => t > windowStart);
  if (recent.length >= AI_RATE_LIMIT.maxRequests) {
    const retryMs = recent[0] + AI_RATE_LIMIT.windowMs - now;
    next(ApiError.badRequest(`Rate limit exceeded — try again in ${Math.ceil(retryMs / 1000)}s`, { retryAfterMs: retryMs }));
    return;
  }
  recent.push(now);
  hits.set(userId, recent);
  next();
}
