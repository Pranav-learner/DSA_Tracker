import { Router } from 'express';
import {
  getOverview,
  getLearning,
  getProblems,
  getKnowledge,
  getRevision,
  getRetention,
  getActivity,
} from '../controllers/analytics.controller.js';

/** /api/analytics — the unified analytics aggregation layer (read-only). */
const router = Router();

router.get('/overview', getOverview);
router.get('/learning', getLearning);
router.get('/problems', getProblems);
router.get('/knowledge', getKnowledge);
router.get('/revision', getRevision);
router.get('/retention', getRetention);
router.get('/activity', getActivity);

export default router;
