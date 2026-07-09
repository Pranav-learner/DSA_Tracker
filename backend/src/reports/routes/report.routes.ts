import { Router } from 'express';
import {
  getWeekly,
  getMonthly,
  getSummary,
  getPhaseReport,
  exportPdf,
  exportMarkdown,
  exportJson,
  exportCsv,
} from '../controllers/report.controller.js';

/** /api/reports — report generation + multi-format export (read-only). */
const router = Router();

// Exports first (distinct from the /:phaseId param route under /phase).
router.get('/export/pdf', exportPdf);
router.get('/export/markdown', exportMarkdown);
router.get('/export/json', exportJson);
router.get('/export/csv', exportCsv);

router.get('/weekly', getWeekly);
router.get('/monthly', getMonthly);
router.get('/summary', getSummary);
router.get('/phase/:phaseId', getPhaseReport);

export default router;
