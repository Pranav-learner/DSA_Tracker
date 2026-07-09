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
import {
  getPatterns,
  getPattern,
  getWeaknesses,
  getStrengths,
  getInsights,
  getTrends,
  getRecommendations,
} from '../controllers/intelligence.controller.js';
import { getExecutive } from '../controllers/executive.controller.js';

/** /api/analytics — the unified analytics aggregation + intelligence layer (read-only). */
const router = Router();

router.get('/overview', getOverview);
router.get('/learning', getLearning);
router.get('/problems', getProblems);
router.get('/knowledge', getKnowledge);
router.get('/revision', getRevision);
router.get('/retention', getRetention);
router.get('/activity', getActivity);

// Module 4 · Sprint 3 — Pattern Intelligence & Insights (static routes before :param).
router.get('/patterns', getPatterns);
router.get('/weaknesses', getWeaknesses);
router.get('/strengths', getStrengths);
router.get('/insights', getInsights);
router.get('/trends', getTrends);
router.get('/recommendations', getRecommendations);
router.get('/executive', getExecutive);
router.get('/patterns/:patternId', getPattern);

export default router;
