import { Router } from 'express';
import { getRecommendation } from '../controllers/recommendation.controller.js';

const router = Router();

router.get('/', getRecommendation);

export default router;
