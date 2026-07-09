import { Router } from 'express';
import { getLearningState } from '../controllers/learning.controller.js';

const router = Router();

router.get('/state', getLearningState);

export default router;
