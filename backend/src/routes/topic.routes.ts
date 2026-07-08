import { Router } from 'express';
import { listTopics, getTopic } from '../controllers/topic.controller.js';

const router = Router();

router.get('/', listTopics);
router.get('/:topicId', getTopic);

export default router;
