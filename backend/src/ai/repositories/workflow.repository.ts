import { MentorWorkflow, type MentorWorkflowDocument } from '../../models/MentorWorkflow.js';
import type { WorkflowDTO, WorkflowStatus } from '../os/types.js';

/**
 * Workflow repository — sole owner of MentorWorkflow MongoDB operations. Reads are
 * scoped by `userId`. A generated workflow is saved so it appears in GET
 * /workflows and the timeline, and can carry a status the learner drives.
 */
export const workflowRepository = {
  create(userId: string, workflow: WorkflowDTO): Promise<MentorWorkflowDocument> {
    return MentorWorkflow.create({
      userId,
      key: workflow.key,
      name: workflow.name,
      description: workflow.description,
      category: workflow.category,
      difficulty: workflow.difficulty,
      estimatedMinutes: workflow.estimatedMinutes,
      modules: workflow.modules,
      steps: workflow.steps,
      expectedOutcome: workflow.expectedOutcome,
      status: 'generated',
    });
  },

  list(userId: string, limit = 20): Promise<MentorWorkflowDocument[]> {
    return MentorWorkflow.find({ userId }).sort({ updatedAt: -1 }).limit(limit).exec();
  },

  findById(userId: string, id: string): Promise<MentorWorkflowDocument | null> {
    return MentorWorkflow.findOne({ _id: id, userId }).exec();
  },

  updateStatus(userId: string, id: string, status: WorkflowStatus): Promise<MentorWorkflowDocument | null> {
    return MentorWorkflow.findOneAndUpdate({ _id: id, userId }, { $set: { status } }, { new: true }).exec();
  },

  /** Most recent saved workflow with the given key (for dedupe within a window). */
  latestByKey(userId: string, key: string): Promise<MentorWorkflowDocument | null> {
    return MentorWorkflow.findOne({ userId, key }).sort({ updatedAt: -1 }).exec();
  },
};
