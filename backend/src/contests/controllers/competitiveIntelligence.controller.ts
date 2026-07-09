import type { Request, Response } from 'express';
import { competitiveIntelligenceService } from '../services/competitiveIntelligence.service.js';
import { resolveAnalyticsWindow } from '../../analytics/validators/analytics.validator.js';
import { currentUserId } from '../../utils/currentUser.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';

/** GET /api/contest/intelligence — the full competitive-intelligence payload. */
export const getIntelligence = asyncHandler(async (req: Request, res: Response) => {
  const window = resolveAnalyticsWindow(req.query);
  const data = await competitiveIntelligenceService.overview(currentUserId(req), window);
  res.status(200).json(ok(data));
});

/** GET /api/contest/readiness — the contest-readiness score + breakdown. */
export const getReadiness = asyncHandler(async (req: Request, res: Response) => {
  const window = resolveAnalyticsWindow(req.query);
  const data = await competitiveIntelligenceService.readiness(currentUserId(req), window);
  res.status(200).json(ok(data));
});

/** GET /api/contest/correlation — rule-based learning↔contest correlations. */
export const getCorrelation = asyncHandler(async (req: Request, res: Response) => {
  const window = resolveAnalyticsWindow(req.query);
  const data = await competitiveIntelligenceService.correlation(currentUserId(req), window);
  res.status(200).json(ok(data));
});

/** GET /api/contest/insights — competitive insights feed. */
export const getInsights = asyncHandler(async (req: Request, res: Response) => {
  const window = resolveAnalyticsWindow(req.query);
  const data = await competitiveIntelligenceService.insights(currentUserId(req), window);
  res.status(200).json(ok(data, { count: data.length }));
});

/** GET /api/contest/rating-analysis — comprehensive rating analysis. */
export const getRatingAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const window = resolveAnalyticsWindow(req.query);
  const data = await competitiveIntelligenceService.ratingAnalysis(currentUserId(req), window);
  res.status(200).json(ok(data));
});
