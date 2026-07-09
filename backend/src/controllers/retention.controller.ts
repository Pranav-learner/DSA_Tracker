import type { Request, Response } from 'express';
import { retentionService } from '../services/retention.service.js';
import {
  parseRetentionListQuery,
  parseRetentionHistoryQuery,
  parseUpdateRetention,
} from '../validators/retention.validator.js';
import { currentUserId } from '../utils/currentUser.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ok } from '../utils/ApiResponse.js';

/** GET /api/retention — every retention profile (optionally filtered by type). */
export const listRetention = asyncHandler(async (req: Request, res: Response) => {
  const query = parseRetentionListQuery(req.query);
  const profiles = await retentionService.listProfiles(currentUserId(req), query.entityType);
  res.status(200).json(ok(profiles, { count: profiles.length }));
});

/** GET /api/retention/overview — aggregate retention + confidence dashboard data. */
export const getRetentionOverview = asyncHandler(async (req: Request, res: Response) => {
  const overview = await retentionService.overview(currentUserId(req));
  res.status(200).json(ok(overview));
});

/** GET /api/retention/history — recent retention snapshots across all entities. */
export const getRetentionHistory = asyncHandler(async (req: Request, res: Response) => {
  const query = parseRetentionHistoryQuery(req.query);
  const rows = await retentionService.history(currentUserId(req), query.limit);
  res.status(200).json(ok(rows, { count: rows.length }));
});

/** GET /api/confidence — confidence overview + per-entity confidence + trend. */
export const getConfidence = asyncHandler(async (req: Request, res: Response) => {
  const confidence = await retentionService.confidence(currentUserId(req));
  res.status(200).json(ok(confidence));
});

/** GET /api/retention/:entityId — one entity's retention profile. */
export const getRetentionByEntity = asyncHandler(async (req: Request, res: Response) => {
  const profile = await retentionService.getByEntity(currentUserId(req), req.params.entityId);
  if (!profile) throw ApiError.notFound(`Retention profile for '${req.params.entityId}' not found`);
  res.status(200).json(ok(profile));
});

/** PATCH /api/retention/:entityId — manual confidence override (recomputes retention). */
export const updateRetention = asyncHandler(async (req: Request, res: Response) => {
  const body = parseUpdateRetention(req.body);
  const profile = await retentionService.update(currentUserId(req), req.params.entityId, body);
  res.status(200).json(ok(profile));
});
