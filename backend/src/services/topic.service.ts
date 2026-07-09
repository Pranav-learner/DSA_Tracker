import { phaseRepository } from '../repositories/phase.repository.js';
import { topicRepository } from '../repositories/topic.repository.js';
import { ApiError } from '../utils/ApiError.js';
import {
  toTopicDTO,
  toTopicDetailDTO,
  toTopicSummaryDTO,
  toRepresentativeProblemDTO,
  type TopicDTO,
  type TopicDetailDTO,
  type TopicSummaryDTO,
  type RepresentativeProblemDTO,
  type TopicNavigationDTO,
} from './mappers.js';
import type { TopicDocument } from '../models/Topic.js';

/** Resolve a list of slugs into summaries, preserving the requested order. */
function orderBySlugs(slugs: string[], topics: TopicDocument[]): TopicSummaryDTO[] {
  const bySlug = new Map(topics.map((t) => [t.slug, t]));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((t): t is TopicDocument => Boolean(t))
    .map(toTopicSummaryDTO);
}

/**
 * Topic service — business logic for topics and the topic workspace.
 */
export const topicService = {
  async list(): Promise<TopicDTO[]> {
    const topics = await topicRepository.findAll();
    return topics.map(toTopicDTO);
  },

  /** Full workspace detail: concept, keywords, relations, phase & navigation. */
  async getById(id: string): Promise<TopicDetailDTO> {
    const topic = await topicRepository.findById(id);
    if (!topic) {
      throw ApiError.notFound(`Topic '${id}' not found`);
    }

    const [phase, siblings] = await Promise.all([
      phaseRepository.findById(String(topic.phaseId)),
      topicRepository.findByPhaseId(String(topic.phaseId)),
    ]);
    if (!phase) {
      throw ApiError.notFound(`Phase for topic '${id}' not found`);
    }

    // Previous / next topic derived from ordering within the phase.
    const index = siblings.findIndex((t) => String(t._id) === String(topic._id));
    const navigation: TopicNavigationDTO = {
      previous: index > 0 ? toTopicSummaryDTO(siblings[index - 1]) : null,
      next: index >= 0 && index < siblings.length - 1 ? toTopicSummaryDTO(siblings[index + 1]) : null,
    };

    return toTopicDetailDTO(topic, phase, navigation);
  },

  async listByPhase(phaseId: string): Promise<TopicDTO[]> {
    const phase = await phaseRepository.findById(phaseId);
    if (!phase) {
      throw ApiError.notFound(`Phase '${phaseId}' not found`);
    }
    const topics = await topicRepository.findByPhaseId(phaseId);
    return topics.map(toTopicDTO);
  },

  /** Prerequisites & related topics resolved to summaries (read-only). */
  async getRelated(
    id: string,
  ): Promise<{ prerequisites: TopicSummaryDTO[]; related: TopicSummaryDTO[] }> {
    const topic = await topicRepository.findById(id);
    if (!topic) {
      throw ApiError.notFound(`Topic '${id}' not found`);
    }
    const slugs = [...new Set([...topic.prerequisites, ...topic.relatedTopics])];
    const resolved = await topicRepository.findBySlugs(slugs);
    return {
      prerequisites: orderBySlugs(topic.prerequisites, resolved),
      related: orderBySlugs(topic.relatedTopics, resolved),
    };
  },

  /** Read-only representative problems for a topic. */
  async getProblems(id: string): Promise<RepresentativeProblemDTO[]> {
    const topic = await topicRepository.findById(id);
    if (!topic) {
      throw ApiError.notFound(`Topic '${id}' not found`);
    }
    return topic.representativeProblems.map(toRepresentativeProblemDTO);
  },
};
