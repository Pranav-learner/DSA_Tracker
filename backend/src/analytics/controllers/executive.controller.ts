import type { Request, Response } from 'express';
import { executiveMetricsService } from '../services/executiveMetrics.service.js';
import { analyticsAggregationService } from '../services/analyticsAggregation.service.js';
import { resolveAnalyticsWindow } from '../validators/analytics.validator.js';
import { analyticsOk } from '../utils/analyticsResponse.js';
import { currentUserId } from '../../utils/currentUser.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

/** GET /api/analytics/executive — composite scores + insights + recommendations. */
export const getExecutive = asyncHandler(async (req: Request, res: Response) => {
  const window = resolveAnalyticsWindow(req.query);
  const userId = currentUserId(req);
  const data = await analyticsAggregationService.section(userId, window, 'executive', () =>
    executiveMetricsService.compute(userId, window),
  );
  res.status(200).json(
    analyticsOk(
      data,
      { scope: 'executive', range: window.label, from: window.from ? window.from.toISOString() : null, to: window.to.toISOString() },
      'Executive summary',
    ),
  );
});
