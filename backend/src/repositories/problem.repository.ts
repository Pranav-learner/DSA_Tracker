import { Problem, type ProblemDocument, type IProblem } from '../models/Problem.js';
import type { FilterQuery, SortOrder } from 'mongoose';

export interface SearchOptions {
  skip: number;
  limit: number;
  sort: Record<string, SortOrder>;
}

/**
 * Problem repository — sole owner of Problem MongoDB operations. Filters + sort
 * are built by the service and simply executed here (find + count in parallel).
 */
export const problemRepository = {
  findById(id: string): Promise<ProblemDocument | null> {
    return Problem.findById(id).exec();
  },

  findBySlug(slug: string): Promise<ProblemDocument | null> {
    return Problem.findOne({ slug }).exec();
  },

  /** Paginated search: matching page + total count for the same filter. */
  async search(
    filter: FilterQuery<IProblem>,
    { skip, limit, sort }: SearchOptions,
  ): Promise<{ items: ProblemDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      Problem.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      Problem.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },

  /** Distinct patterns present in the catalog — powers the filter panel. */
  distinctPatterns(): Promise<string[]> {
    return Problem.distinct('pattern').exec() as Promise<string[]>;
  },

  countAll(): Promise<number> {
    return Problem.countDocuments().exec();
  },

  insertMany(docs: Partial<IProblem>[]): Promise<unknown> {
    return Problem.insertMany(docs);
  },

  deleteAll(): Promise<unknown> {
    return Problem.deleteMany({}).exec();
  },
};
