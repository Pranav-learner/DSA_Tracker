import { NotebookEntry, type NotebookEntryDocument, type INotebookEntry } from '../models/NotebookEntry.js';
import type { FilterQuery, SortOrder } from 'mongoose';

export interface NotebookSearchOptions {
  skip: number;
  limit: number;
  sort: Record<string, SortOrder>;
}

/**
 * Notebook repository — sole owner of NotebookEntry MongoDB operations. Every
 * read is scoped by the caller-supplied filter (the service always injects
 * `userId`); services never touch Mongoose directly.
 */
export const notebookRepository = {
  create(input: Partial<INotebookEntry>): Promise<NotebookEntryDocument> {
    return NotebookEntry.create(input);
  },

  findById(id: string): Promise<NotebookEntryDocument | null> {
    return NotebookEntry.findById(id).exec();
  },

  findByUserAndProblem(userId: string, problemId: string): Promise<NotebookEntryDocument | null> {
    return NotebookEntry.findOne({ userId, problemId }).exec();
  },

  /** Resolve several of a user's entries by id (for relationship expansion). */
  findByIdsForUser(userId: string, ids: string[]): Promise<NotebookEntryDocument[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return NotebookEntry.find({ userId, _id: { $in: ids } }).exec();
  },

  async search(
    filter: FilterQuery<INotebookEntry>,
    { skip, limit, sort }: NotebookSearchOptions,
  ): Promise<{ items: NotebookEntryDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      NotebookEntry.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      NotebookEntry.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },

  distinctPatterns(userId: string): Promise<string[]> {
    return NotebookEntry.distinct('pattern', { userId }).exec() as Promise<string[]>;
  },

  updateById(id: string, patch: Partial<INotebookEntry>): Promise<NotebookEntryDocument | null> {
    return NotebookEntry.findByIdAndUpdate(id, { $set: patch }, { new: true }).exec();
  },

  deleteById(id: string): Promise<NotebookEntryDocument | null> {
    return NotebookEntry.findByIdAndDelete(id).exec();
  },

  /** Remove a deleted entry's id from every other entry's relatedEntries. */
  pullRelatedEntryRef(userId: string, entryId: string): Promise<unknown> {
    return NotebookEntry.updateMany(
      { userId, relatedEntries: entryId },
      { $pull: { relatedEntries: entryId } },
    ).exec();
  },

  countByUser(userId: string): Promise<number> {
    return NotebookEntry.countDocuments({ userId }).exec();
  },

  insertMany(docs: Partial<INotebookEntry>[]): Promise<unknown> {
    return NotebookEntry.insertMany(docs);
  },

  deleteByUser(userId: string): Promise<unknown> {
    return NotebookEntry.deleteMany({ userId }).exec();
  },
};
