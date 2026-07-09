import { Router } from 'express';
import {
  createSchedule,
  listSchedules,
  getSchedule,
  updateSchedule,
  deleteSchedule,
  getToday,
  getCalendar,
} from '../controllers/revision.controller.js';
import {
  getWorkspace,
  startSession,
  completeSession,
  getActiveSession,
  getSession,
  updateSession,
  getHistory,
  getEntityHistory,
} from '../controllers/revisionSession.controller.js';

const router = Router();

// Queue + calendar (distinct prefixes from the /schedules/:id param route).
router.get('/today', getToday);
router.get('/calendar', getCalendar);

router.post('/schedules', createSchedule);
router.get('/schedules', listSchedules);
router.get('/schedules/:id', getSchedule);
router.patch('/schedules/:id', updateSchedule);
router.delete('/schedules/:id', deleteSchedule);

// Module 3 · Sprint 2 — workspace + sessions + history.
router.get('/workspace', getWorkspace);
router.post('/session/start', startSession);
router.post('/session/complete', completeSession);
router.get('/session/active', getActiveSession);
router.get('/session/:id', getSession);
router.patch('/session/:id', updateSession);
router.get('/history', getHistory);
router.get('/history/:entityId', getEntityHistory);

export default router;
