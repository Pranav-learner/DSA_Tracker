import type { Request, Response } from 'express';
import { patternIntelligenceService } from '../services/patternIntelligence.service.js';
import { resolveAnalyticsWindow } from '../validators/analytics.validator.js';
import { analyticsOk } from '../utils/analyticsResponse.js';
import { currentUserId } from '../../utils/currentUser.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { isValidObjectId } from 'mongoose';
import type { AnalyticsWindow } from '../types/analytics.types.js';

function meta(window: AnalyticsWindow, scope: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    scope,
    range: window.label,
    from: window.from ? window.from.toISOString() : null,
    to: window.to.toISOString(),
    days: window.days,
    ...extra,
  };
}

/** GET /api/analytics/patterns — every pattern's intelligence profile. */
export const getPatterns = asyncHandler(async (req: Request, res: Response) => {
  const window = resolveAnalyticsWindow(req.query);
  const data = await patternIntelligenceService.patterns(currentUserId(req), window);
  res.status(200).json(analyticsOk(data, meta(window, 'patterns', { count: data.length }), 'Pattern intelligence'));
});

/** GET /api/analytics/patterns/:patternId — one pattern profile + matrix. */
export const getPattern = asyncHandler(async (req: Request, res: Response) => {
  const { patternId } = req.params;
  if (!isValidObjectId(patternId)) throw ApiError.badRequest('Invalid pattern id');
  const data = await patternIntelligenceService.pattern(currentUserId(req), patternId);
  if (!data) throw ApiError.notFound(`Pattern '${patternId}' not found or not yet started`);
  res.status(200).json(analyticsOk(data, { scope: 'pattern', patternId }, 'Pattern profile'));
});

/** GET /api/analytics/weaknesses — rule-based weakness signals (severity-ranked). */
export const getWeaknesses = asyncHandler(async (req: Request, res: Response) => {
  const window = resolveAnalyticsWindow(req.query);
  const data = await patternIntelligenceService.weaknesses(currentUserId(req), window);
  res.status(200).json(analyticsOk(data, meta(window, 'weaknesses', { count: data.length }), 'Weakness report'));
});

/** GET /api/analytics/strengths — rule-based strength signals. */
export const getStrengths = asyncHandler(async (req: Request, res: Response) => {
  const window = resolveAnalyticsWindow(req.query);
  const data = await patternIntelligenceService.strengths(currentUserId(req), window);
  res.status(200).json(analyticsOk(data, meta(window, 'strengths', { count: data.length }), 'Strength report'));
});

/** GET /api/analytics/insights — the dynamic insights feed. */
export const getInsights = asyncHandler(async (req: Request, res: Response) => {
  const window = resolveAnalyticsWindow(req.query);
  const data = await patternIntelligenceService.insights(currentUserId(req), window);
  res.status(200).json(analyticsOk(data, meta(window, 'insights', { count: data.length }), 'Learning insights'));
});

/** GET /api/analytics/trends — metric trend directions (current vs previous). */
export const getTrends = asyncHandler(async (req: Request, res: Response) => {
  const window = resolveAnalyticsWindow(req.query);
  const data = await patternIntelligenceService.trends(currentUserId(req), window);
  res.status(200).json(analyticsOk(data, meta(window, 'trends', { count: data.length }), 'Trend analysis'));
});

/** GET /api/analytics/recommendations — actionable, rule-based recommendations. */
export const getRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const window = resolveAnalyticsWindow(req.query);
  const data = await patternIntelligenceService.recommendations(currentUserId(req), window);
  res.status(200).json(analyticsOk(data, meta(window, 'recommendations', { count: data.length }), 'Recommendation center'));
});
