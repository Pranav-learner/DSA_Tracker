import type { Request, Response } from 'express';
import { analyticsAggregationService } from '../services/analyticsAggregation.service.js';
import { resolveAnalyticsWindow } from '../validators/analytics.validator.js';
import { analyticsOk } from '../utils/analyticsResponse.js';
import { currentUserId } from '../../utils/currentUser.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import type { AnalyticsWindow } from '../types/analytics.types.js';

/** Metadata block echoed on every analytics response (window + scope). */
function windowMeta(window: AnalyticsWindow, scope: string): Record<string, unknown> {
  return {
    scope,
    range: window.label,
    from: window.from ? window.from.toISOString() : null,
    to: window.to.toISOString(),
    days: window.days,
  };
}

/** GET /api/analytics/overview — every scope in one aggregated payload. */
export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const window = resolveAnalyticsWindow(req.query);
  const data = await analyticsAggregationService.overview(currentUserId(req), window);
  res.status(200).json(analyticsOk(data, windowMeta(window, 'overview'), 'Analytics overview'));
});

/** GET /api/analytics/learning */
export const getLearning = asyncHandler(async (req: Request, res: Response) => {
  const window = resolveAnalyticsWindow(req.query);
  const data = await analyticsAggregationService.learning(currentUserId(req), window);
  res.status(200).json(analyticsOk(data, windowMeta(window, 'learning'), 'Learning analytics'));
});

/** GET /api/analytics/problems */
export const getProblems = asyncHandler(async (req: Request, res: Response) => {
  const window = resolveAnalyticsWindow(req.query);
  const data = await analyticsAggregationService.problems(currentUserId(req), window);
  res.status(200).json(analyticsOk(data, windowMeta(window, 'problems'), 'Problem analytics'));
});

/** GET /api/analytics/knowledge */
export const getKnowledge = asyncHandler(async (req: Request, res: Response) => {
  const window = resolveAnalyticsWindow(req.query);
  const data = await analyticsAggregationService.knowledge(currentUserId(req), window);
  res.status(200).json(analyticsOk(data, windowMeta(window, 'knowledge'), 'Knowledge analytics'));
});

/** GET /api/analytics/revision */
export const getRevision = asyncHandler(async (req: Request, res: Response) => {
  const window = resolveAnalyticsWindow(req.query);
  const data = await analyticsAggregationService.revision(currentUserId(req), window);
  res.status(200).json(analyticsOk(data, windowMeta(window, 'revision'), 'Revision analytics'));
});

/** GET /api/analytics/retention */
export const getRetention = asyncHandler(async (req: Request, res: Response) => {
  const window = resolveAnalyticsWindow(req.query);
  const data = await analyticsAggregationService.retention(currentUserId(req), window);
  res.status(200).json(analyticsOk(data, windowMeta(window, 'retention'), 'Retention analytics'));
});

/** GET /api/analytics/activity */
export const getActivity = asyncHandler(async (req: Request, res: Response) => {
  const window = resolveAnalyticsWindow(req.query);
  const data = await analyticsAggregationService.activity(currentUserId(req), window);
  res.status(200).json(analyticsOk(data, windowMeta(window, 'activity'), 'Activity analytics'));
});
