import { Router } from 'express';
import { listPhases, getPhase, getPhaseTopics } from '../controllers/phase.controller.js';

const router = Router();

router.get('/', listPhases);
router.get('/:phaseId', getPhase);
router.get('/:phaseId/topics', getPhaseTopics);

export default router;
