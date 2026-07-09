import type { Request, Response } from 'express';
import { notebookService } from '../services/notebook.service.js';
import {
  parseCreateNotebook,
  parseUpdateNotebook,
  parseNotebookQuery,
} from '../validators/notebook.validator.js';
import { assertObjectId } from '../validators/objectId.validator.js';
import { currentUserId } from '../utils/currentUser.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';

/** POST /api/notebook — create a structured notebook entry for a problem. */
export const createNotebook = asyncHandler(async (req: Request, res: Response) => {
  const body = parseCreateNotebook(req.body);
  const entry = await notebookService.create(currentUserId(req), body);
  res.status(201).json(ok(entry));
});

/** GET /api/notebook — paginated, filterable notebook index. */
export const listNotebook = asyncHandler(async (req: Request, res: Response) => {
  const query = parseNotebookQuery(req.query);
  const page = await notebookService.list(currentUserId(req), query);
  res.status(200).json(ok(page));
});

/** GET /api/notebook/search — same contract as list, geared around `q`. */
export const searchNotebook = listNotebook;

/** GET /api/notebook/facets — available filter values (patterns / platforms). */
export const getNotebookFacets = asyncHandler(async (req: Request, res: Response) => {
  const facets = await notebookService.facets(currentUserId(req));
  res.status(200).json(ok(facets));
});

/** GET /api/notebook/:id — full entry with resolved relationships. */
export const getNotebook = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'notebook id');
  const entry = await notebookService.getById(currentUserId(req), id);
  res.status(200).json(ok(entry));
});

/** PATCH /api/notebook/:id — update an entry (content / relationships / review). */
export const updateNotebook = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'notebook id');
  const body = parseUpdateNotebook(req.body);
  const entry = await notebookService.update(currentUserId(req), id, body);
  res.status(200).json(ok(entry));
});

/** DELETE /api/notebook/:id — remove an entry (and unlink it from others). */
export const deleteNotebook = asyncHandler(async (req: Request, res: Response) => {
  const id = assertObjectId(req.params.id, 'notebook id');
  await notebookService.remove(currentUserId(req), id);
  res.status(200).json(ok({ id, deleted: true }));
});
