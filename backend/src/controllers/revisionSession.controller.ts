import type { Request, Response } from 'express';
import { revisionSessionService } from '../services/revisionSession.service.js';
import { revisionWorkspaceService } from '../services/revisionWorkspace.service.js';
import {
  parseStartSession,
  parseCompleteSession,
  parseUpdateSession,
  parseSessionHistoryQuery,
  parseWorkspaceQuery,
} from '../validators/revisionSession.validator.js';
import { assertObjectId } from '../validators/objectId.validator.js';
import { currentUserId } from '../utils/currentUser.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';

/** GET /api/revision/workspace — knowledge content + active session + schedule. */
export const getWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const query = parseWorkspaceQuery(req.query);
  const workspace = await revisionWorkspaceService.getWorkspace(currentUserId(req), query);
  res.status(200).json(ok(workspace));
});

/** POST /api/revision/session/start — begin an active review (one per user). */
export const startSession = asyncHandler(async (req: Request, res: Response) => {
  const body = parseStartSession(req.body);
  const session = await revisionSessionService.start(currentUserId(req), body);
  res.status(201).json(ok(session));
});

/** POST /api/revision/session/complete — finish a session (advances its schedule). */
export const completeSession = asyncHandler(async (req: Request, res: Response) => {
  const body = parseCompleteSession(req.body);
  const session = await revisionSessionService.complete(currentUserId(req), body);
  res.status(200).json(ok(session));
});

/** GET /api/revision/session/active — the current active session, or null. */
export const getActiveSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await revisionSessionService.getActive(currentUserId(req));
  res.status(200).json(ok(session));
});

/** GET /api/revision/session/:id — one session. */
export const getSession = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'session id');
  const session = await revisionSessionService.getById(currentUserId(req), id);
  res.status(200).json(ok(session));
});

/** PATCH /api/revision/session/:id — notes / confidence / reviewed refs / pause·resume·abandon. */
export const updateSession = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'session id');
  const body = parseUpdateSession(req.body);
  const session = await revisionSessionService.update(currentUserId(req), id, body);
  res.status(200).json(ok(session));
});

/** GET /api/revision/history — paginated, filterable session history. */
export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const query = parseSessionHistoryQuery(req.query);
  const page = await revisionSessionService.history(currentUserId(req), query);
  res.status(200).json(ok(page));
});

/** GET /api/revision/history/:entityId — all sessions for one entity. */
export const getEntityHistory = asyncHandler(async (req: Request, res: Response) => {
  const sessions = await revisionSessionService.historyByEntity(currentUserId(req), req.params.entityId);
  res.status(200).json(ok(sessions, { count: sessions.length }));
});
