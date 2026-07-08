import { phaseRepository } from '../repositories/phase.repository.js';
import { topicRepository } from '../repositories/topic.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { toTopicDTO, type TopicDTO } from './mappers.js';

/**
 * Topic service — business logic for topics.
 */
export const topicService = {
  async list(): Promise<TopicDTO[]> {
    const topics = await topicRepository.findAll();
    return topics.map(toTopicDTO);
  },

  async getById(id: string): Promise<TopicDTO> {
    const topic = await topicRepository.findById(id);
    if (!topic) {
      throw ApiError.notFound(`Topic '${id}' not found`);
    }
    return toTopicDTO(topic);
  },

  async listByPhase(phaseId: string): Promise<TopicDTO[]> {
    const phase = await phaseRepository.findById(phaseId);
    if (!phase) {
      throw ApiError.notFound(`Phase '${phaseId}' not found`);
    }
    const topics = await topicRepository.findByPhaseId(phaseId);
    return topics.map(toTopicDTO);
  },
};
