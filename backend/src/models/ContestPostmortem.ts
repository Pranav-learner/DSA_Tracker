import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';

/** One structured learning goal captured in a postmortem. */
export interface ILearningGoal {
  text: string;
  topicId: Types.ObjectId | null;
  done: boolean;
}

/**
 * ContestPostmortem — the structured reflection + analysis for one contest, per
 * user. User-authored (markdown supported); the `summary` is a rule-based
 * digest (no AI). One postmortem per contest.
 */
export interface IContestPostmortem {
  contestRef: Types.ObjectId;
  userId: string;
  overallPerformance: string;
  // --- reflection (markdown) ---
  whatWentWell: string;
  whatWentWrong: string;
  biggestMistake: string;
  biggestLearning: string;
  nextFocus: string;
  timeManagementNotes: string;
  // --- analysis lists ---
  strengths: string[];
  weaknesses: string[];
  missedPatterns: string[];
  implementationMistakes: string[];
  debuggingMistakes: string[];
  algorithmGaps: string[];
  learningGoals: ILearningGoal[];
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

const learningGoalSchema = new Schema<ILearningGoal>(
  {
    text: { type: String, required: true, trim: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', default: null },
    done: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const contestPostmortemSchema = new Schema<IContestPostmortem>(
  {
    contestRef: { type: Schema.Types.ObjectId, ref: 'Contest', required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    overallPerformance: { type: String, default: '' },
    whatWentWell: { type: String, default: '' },
    whatWentWrong: { type: String, default: '' },
    biggestMistake: { type: String, default: '' },
    biggestLearning: { type: String, default: '' },
    nextFocus: { type: String, default: '' },
    timeManagementNotes: { type: String, default: '' },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    missedPatterns: { type: [String], default: [] },
    implementationMistakes: { type: [String], default: [] },
    debuggingMistakes: { type: [String], default: [] },
    algorithmGaps: { type: [String], default: [] },
    learningGoals: { type: [learningGoalSchema], default: [] },
    summary: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

export const ContestPostmortem: Model<IContestPostmortem> = model<IContestPostmortem>(
  'ContestPostmortem',
  contestPostmortemSchema,
);
export type ContestPostmortemDocument = HydratedDocument<IContestPostmortem>;
