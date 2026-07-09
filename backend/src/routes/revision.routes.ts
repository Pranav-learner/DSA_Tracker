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

const router = Router();

// Queue + calendar (distinct prefixes from the /schedules/:id param route).
router.get('/today', getToday);
router.get('/calendar', getCalendar);

router.post('/schedules', createSchedule);
router.get('/schedules', listSchedules);
router.get('/schedules/:id', getSchedule);
router.patch('/schedules/:id', updateSchedule);
router.delete('/schedules/:id', deleteSchedule);

export default router;
