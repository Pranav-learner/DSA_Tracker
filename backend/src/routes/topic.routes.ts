import { Router } from 'express';
import {
  listTopics,
  getTopic,
  getTopicRelated,
  getTopicProblems,
  listUnlockedTopics,
  getTopicProgress,
  patchTopicProgress,
  getTopicMastery,
  patchTopicMastery,
  unlockTopic,
} from '../controllers/topic.controller.js';

const router = Router();

router.get('/', listTopics);
// Static path must be registered before the `/:topicId` param route.
router.get('/unlocked', listUnlockedTopics);

router.get('/:topicId', getTopic);
router.get('/:topicId/related', getTopicRelated);
router.get('/:topicId/problems', getTopicProblems);

// --- Sprint 3: per-user learning engine ---
router.get('/:topicId/progress', getTopicProgress);
router.patch('/:topicId/progress', patchTopicProgress);
router.get('/:topicId/mastery', getTopicMastery);
router.patch('/:topicId/mastery', patchTopicMastery);
router.post('/:topicId/unlock', unlockTopic);

export default router;
