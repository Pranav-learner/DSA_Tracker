import { contestTimelineRepository } from '../repositories/contestTimeline.repository.js';
import { Types } from 'mongoose';
import type { ContestTimelineEventDocument } from '../../models/ContestTimelineEvent.js';
import type { CreateTimelineEventBody } from '../validators/contestWorkspace.validator.js';
import type { ContestTimelineEventDTO } from '../dto/workspace.dto.js';

function toDTO(doc: ContestTimelineEventDocument, contestStart: Date): ContestTimelineEventDTO {
  const offset = Math.round((doc.timestamp.getTime() - contestStart.getTime()) / 60_000);
  return {
    id: String(doc._id),
    contestRef: String(doc.contestRef),
    timestamp: doc.timestamp.toISOString(),
    eventType: doc.eventType,
    problemRef: doc.problemRef ? String(doc.problemRef) : null,
    problemCode: doc.problemCode,
    description: doc.description,
    offsetMinutes: Number.isFinite(offset) ? Math.max(0, offset) : null,
  };
}

/**
 * ContestTimelineService — creates and reads chronological contest events.
 * Append-only; reads are always sorted by timestamp. Offsets are derived from
 * the contest's start time at read.
 */
export const contestTimelineService = {
  async createEvent(userId: string, contestRef: string, body: CreateTimelineEventBody): Promise<ContestTimelineEventDocument> {
    return contestTimelineRepository.create({
      contestRef: new Types.ObjectId(contestRef),
      userId,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      eventType: body.eventType,
      problemRef: body.problemRef ? new Types.ObjectId(body.problemRef) : null,
      problemCode: body.problemCode ?? '',
      description: body.description ?? '',
    });
  },

  /** Chronological timeline for a contest (offsets relative to `contestStart`). */
  async list(userId: string, contestRef: string, contestStart: Date, limit?: number): Promise<ContestTimelineEventDTO[]> {
    const events = await contestTimelineRepository.findByContest(userId, contestRef, limit);
    return events.map((e) => toDTO(e, contestStart));
  },

  count(userId: string, contestRef: string): Promise<number> {
    return contestTimelineRepository.countByContest(userId, contestRef);
  },

  toDTO,

  remove(userId: string, contestRef: string): Promise<unknown> {
    return contestTimelineRepository.deleteByContest(userId, contestRef);
  },
};
