import { Router } from 'express';
import {
  listRetention,
  getRetentionOverview,
  getRetentionHistory,
  getConfidence,
  getRetentionByEntity,
  updateRetention,
} from '../controllers/retention.controller.js';

/** /api/retention — retention profiles, overview, history. */
const retentionRouter = Router();

// Static prefixes first (distinct from the /:entityId param route).
retentionRouter.get('/overview', getRetentionOverview);
retentionRouter.get('/history', getRetentionHistory);
retentionRouter.get('/', listRetention);
retentionRouter.get('/:entityId', getRetentionByEntity);
retentionRouter.patch('/:entityId', updateRetention);

/** /api/confidence — confidence overview + per-entity confidence trend. */
export const confidenceRouter = Router();
confidenceRouter.get('/', getConfidence);

export default retentionRouter;
