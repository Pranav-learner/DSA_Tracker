import { Phase, type PhaseDocument } from '../models/Phase.js';

/**
 * Phase repository — the ONLY place Phase MongoDB operations live.
 * Services depend on this abstraction, never on Mongoose directly.
 */
export const phaseRepository = {
  findAll(): Promise<PhaseDocument[]> {
    return Phase.find().sort({ order: 1 }).exec();
  },

  findById(id: string): Promise<PhaseDocument | null> {
    return Phase.findById(id).exec();
  },

  findBySlug(slug: string): Promise<PhaseDocument | null> {
    return Phase.findOne({ slug }).exec();
  },

  count(): Promise<number> {
    return Phase.countDocuments().exec();
  },
};
