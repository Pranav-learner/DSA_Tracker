import { phaseRepository } from '../repositories/phase.repository.js';
import { topicRepository } from '../repositories/topic.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { toPhaseDTO, type PhaseDTO } from './mappers.js';

/**
 * Phase service — business logic for phases.
 * Enriches raw documents with topic counts and progress placeholders.
 */
export const phaseService = {
  async list(): Promise<PhaseDTO[]> {
    const [phases, counts] = await Promise.all([
      phaseRepository.findAll(),
      topicRepository.countGroupedByPhase(),
    ]);
    return phases.map((p) => toPhaseDTO(p, counts.get(String(p._id)) ?? 0));
  },

  async getById(id: string): Promise<PhaseDTO> {
    const phase = await phaseRepository.findById(id);
    if (!phase) {
      throw ApiError.notFound(`Phase '${id}' not found`);
    }
    const topics = await topicRepository.findByPhaseId(id);
    return toPhaseDTO(phase, topics.length);
  },
};
