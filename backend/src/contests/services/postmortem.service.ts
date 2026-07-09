import { contestPostmortemRepository } from '../repositories/contestPostmortem.repository.js';
import { requireOwnedContest } from './contest.service.js';
import { activityService } from '../../services/activity.service.js';
import { Types } from 'mongoose';
import type { ContestPostmortemDocument, ILearningGoal } from '../../models/ContestPostmortem.js';
import type { UpsertPostmortemBody } from '../validators/contestLearning.validator.js';
import type { ContestPostmortemDTO, LearningGoalDTO } from '../dto/learning.dto.js';

function goalDTO(g: ILearningGoal): LearningGoalDTO {
  return { text: g.text, topicId: g.topicId ? String(g.topicId) : null, done: g.done };
}

function toDTO(doc: ContestPostmortemDocument): ContestPostmortemDTO {
  return {
    id: String(doc._id),
    contestRef: String(doc.contestRef),
    overallPerformance: doc.overallPerformance,
    whatWentWell: doc.whatWentWell,
    whatWentWrong: doc.whatWentWrong,
    biggestMistake: doc.biggestMistake,
    biggestLearning: doc.biggestLearning,
    nextFocus: doc.nextFocus,
    timeManagementNotes: doc.timeManagementNotes,
    strengths: doc.strengths,
    weaknesses: doc.weaknesses,
    missedPatterns: doc.missedPatterns,
    implementationMistakes: doc.implementationMistakes,
    debuggingMistakes: doc.debuggingMistakes,
    algorithmGaps: doc.algorithmGaps,
    learningGoals: doc.learningGoals.map(goalDTO),
    summary: doc.summary,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/** A rule-based (NOT AI) digest of the postmortem's key fields. */
function buildSummary(body: UpsertPostmortemBody, prev: ContestPostmortemDocument | null): string {
  const perf = body.overallPerformance ?? prev?.overallPerformance ?? '';
  const win = body.whatWentWell ?? prev?.whatWentWell ?? '';
  const loss = body.whatWentWrong ?? prev?.whatWentWrong ?? '';
  const learning = body.biggestLearning ?? prev?.biggestLearning ?? '';
  const next = body.nextFocus ?? prev?.nextFocus ?? '';
  const parts: string[] = [];
  if (perf) parts.push(`Performance: ${perf}.`);
  if (win) parts.push(`Went well: ${win.split('\n')[0]}.`);
  if (loss) parts.push(`Went wrong: ${loss.split('\n')[0]}.`);
  if (learning) parts.push(`Key learning: ${learning.split('\n')[0]}.`);
  if (next) parts.push(`Next focus: ${next.split('\n')[0]}.`);
  return parts.join(' ');
}

/**
 * PostmortemService — CRUD for the contest reflection/analysis. One postmortem
 * per contest (upsert). The `summary` is a rule-based digest; no AI.
 */
export const postmortemService = {
  async getByContest(userId: string, contestId: string): Promise<ContestPostmortemDTO | null> {
    await requireOwnedContest(userId, contestId);
    const doc = await contestPostmortemRepository.findByContest(userId, contestId);
    return doc ? toDTO(doc) : null;
  },

  async upsert(userId: string, contestId: string, body: UpsertPostmortemBody): Promise<ContestPostmortemDTO> {
    const contest = await requireOwnedContest(userId, contestId);
    const prev = await contestPostmortemRepository.findByContest(userId, contestId);

    const goals: ILearningGoal[] | undefined = body.learningGoals?.map((g) => ({
      text: g.text,
      topicId: g.topicId ? new Types.ObjectId(g.topicId) : null,
      done: g.done ?? false,
    }));

    const patch: Record<string, unknown> = { ...body, summary: body.summary ?? buildSummary(body, prev) };
    if (goals) patch.learningGoals = goals;

    const doc = prev
      ? ((await contestPostmortemRepository.updateByContest(userId, contestId, patch)) as ContestPostmortemDocument)
      : await contestPostmortemRepository.create({ ...patch, contestRef: contest._id, userId });

    // Activity: reflected (first time) + new learning goals.
    if (!prev) {
      await activityService.record(userId, { type: 'contest-reflected', entityType: 'contest', entityId: contestId, title: `Reflected on ${contest.contestName}`, description: doc.summary || contest.platform });
    }
    const prevGoalCount = prev?.learningGoals.length ?? 0;
    if (goals && goals.length > prevGoalCount) {
      await activityService.record(userId, { type: 'learning-goal-created', entityType: 'contest', entityId: contestId, title: `New learning goal from ${contest.contestName}`, description: goals[goals.length - 1].text });
    }
    return toDTO(doc);
  },

  async history(userId: string): Promise<ContestPostmortemDTO[]> {
    const docs = await contestPostmortemRepository.findRecent(userId);
    return docs.map(toDTO);
  },

  remove(userId: string, contestId: string): Promise<unknown> {
    return contestPostmortemRepository.deleteByContest(userId, contestId);
  },
};
