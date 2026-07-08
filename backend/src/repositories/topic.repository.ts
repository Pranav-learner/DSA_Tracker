import { Topic, type TopicDocument } from '../models/Topic.js';

/**
 * Topic repository — sole owner of Topic MongoDB operations.
 */
export const topicRepository = {
  findAll(): Promise<TopicDocument[]> {
    return Topic.find().sort({ phaseId: 1, order: 1 }).exec();
  },

  findById(id: string): Promise<TopicDocument | null> {
    return Topic.findById(id).exec();
  },

  findByPhaseId(phaseId: string): Promise<TopicDocument[]> {
    return Topic.find({ phaseId }).sort({ order: 1 }).exec();
  },

  /** Topic counts grouped by phase — used to enrich the roadmap response. */
  async countGroupedByPhase(): Promise<Map<string, number>> {
    const rows = await Topic.aggregate<{ _id: unknown; count: number }>([
      { $group: { _id: '$phaseId', count: { $sum: 1 } } },
    ]).exec();
    return new Map(rows.map((r) => [String(r._id), r.count]));
  },
};
