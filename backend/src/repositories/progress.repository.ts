import { phaseRepository } from './phase.repository.js';
import { topicRepository } from './topic.repository.js';
import { topicProgressRepository } from './topicProgress.repository.js';
import type { PhaseDocument } from '../models/Phase.js';
import type { TopicDocument } from '../models/Topic.js';
import type { TopicProgressDocument } from '../models/TopicProgress.js';

export interface UserRoadmapData {
  phases: PhaseDocument[];
  topics: TopicDocument[];
  progressByTopicId: Map<string, TopicProgressDocument>;
}

/**
 * Progress repository — a read-model that assembles, in one place, all the raw
 * data the ProgressService needs (phases + topics + a user's progress). Services
 * therefore never touch Mongoose directly. It composes the feature repositories
 * rather than duplicating their queries.
 */
export const progressRepository = {
  async loadUserRoadmap(userId: string): Promise<UserRoadmapData> {
    const [phases, topics] = await Promise.all([
      phaseRepository.findAll(),
      topicRepository.findAll(),
    ]);
    const progress = await topicProgressRepository.findByUserAndTopics(
      userId,
      topics.map((t) => String(t._id)),
    );
    const progressByTopicId = new Map(progress.map((p) => [String(p.topicId), p]));
    return { phases, topics, progressByTopicId };
  },
};
