import { Router } from 'express';
import { getRoadmap } from '../controllers/roadmap.controller.js';

const router = Router();

router.get('/', getRoadmap);

export default router;
