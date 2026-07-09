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

  /** Resolve several topics by id in one query (dashboard current/recommended refs). */
  findByIds(ids: string[]): Promise<TopicDocument[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return Topic.find({ _id: { $in: ids } }).exec();
  },

  findByPhaseId(phaseId: string): Promise<TopicDocument[]> {
    return Topic.find({ phaseId }).sort({ order: 1 }).exec();
  },

  /** Resolve topics by their slugs (used for prerequisites & related topics). */
  findBySlugs(slugs: string[]): Promise<TopicDocument[]> {
    if (slugs.length === 0) return Promise.resolve([]);
    return Topic.find({ slug: { $in: slugs } }).exec();
  },

  /** Topic counts grouped by phase — used to enrich the roadmap response. */
  async countGroupedByPhase(): Promise<Map<string, number>> {
    const rows = await Topic.aggregate<{ _id: unknown; count: number }>([
      { $group: { _id: '$phaseId', count: { $sum: 1 } } },
    ]).exec();
    return new Map(rows.map((r) => [String(r._id), r.count]));
  },

  /** Sum of estimated study hours grouped by phase — used for dashboard time-remaining. */
  async estimatedHoursByPhase(): Promise<Map<string, number>> {
    const rows = await Topic.aggregate<{ _id: unknown; hours: number }>([
      { $group: { _id: '$phaseId', hours: { $sum: '$estimatedHours' } } },
    ]).exec();
    return new Map(rows.map((r) => [String(r._id), r.hours]));
  },
};
