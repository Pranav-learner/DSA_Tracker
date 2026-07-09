import { Router } from 'express';
import {
  createAttempt,
  getAttempt,
  updateAttempt,
  deleteAttempt,
} from '../controllers/attempt.controller.js';

const router = Router();

router.post('/', createAttempt);
router.get('/:attemptId', getAttempt);
router.patch('/:attemptId', updateAttempt);
router.delete('/:attemptId', deleteAttempt);

export default router;
