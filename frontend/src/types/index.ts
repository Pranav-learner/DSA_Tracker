/** Shared API DTO types — mirror the backend contract exactly. */

export type Difficulty = 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface Progress {
  completedTopics: number;
  totalTopics: number;
  completedProblems: number;
  totalProblems: number;
  percent: number;
}

export interface Phase {
  id: string;
  title: string;
  slug: string;
  order: number;
  description: string;
  icon: string;
  estimatedWeeks: number;
  estimatedProblems: number;
  color: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  topicCount: number;
  progress: Progress;
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  phaseId: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  estimatedHours: number;
  estimatedProblems: number;
  difficulty: Difficulty;
  isUnlocked: boolean;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ---- Sprint 2: Topic Workspace ---- */

export type Platform =
  | 'LeetCode'
  | 'Codeforces'
  | 'AtCoder'
  | 'CSES'
  | 'HackerRank'
  | 'SPOJ'
  | 'GeeksforGeeks';

export interface ConceptExample {
  title: string;
  detail: string;
}

export interface Concept {
  coreIdea: string;
  whenToUse: string;
  whenNotToUse: string;
  timeComplexity: string;
  spaceComplexity: string;
  advantages: string[];
  limitations: string[];
  applications: string[];
  examples: ConceptExample[];
}

export interface RepresentativeProblem {
  id: string;
  name: string;
  platform: Platform;
  difficulty: Difficulty;
  pattern: string;
  url?: string;
  estimatedMinutes: number;
  status: 'Not Started';
}

/** Lightweight topic reference (navigation, relations, prerequisites). */
export interface TopicSummary {
  id: string;
  title: string;
  slug: string;
  phaseId: string;
  order: number;
  difficulty: Difficulty;
  estimatedHours: number;
  estimatedProblems: number;
  isUnlocked: boolean;
  isCompleted: boolean;
}

export interface PhaseRef {
  id: string;
  title: string;
  order: number;
  slug: string;
  color: string;
  icon: string;
}

export interface TopicNavigation {
  previous: TopicSummary | null;
  next: TopicSummary | null;
}

/** Full topic detail returned by GET /topics/:id. */
export interface TopicDetail extends Topic {
  concept: Concept;
  recognitionKeywords: string[];
  prerequisites: string[];
  relatedTopics: string[];
  representativeProblemCount: number;
  phase: PhaseRef;
  navigation: TopicNavigation;
}

export interface TopicRelations {
  prerequisites: TopicSummary[];
  related: TopicSummary[];
}

/* ---- Sprint 3: Learning Engine ---- */

export type LadderStage =
  | 'recognition'
  | 'implementation'
  | 'standard'
  | 'variant'
  | 'mixed'
  | 'contest';

export type MasteryMetric = LadderStage | 'assessment' | 'confidence';
export type MasteryMetrics = Record<MasteryMetric, number>;
export type MasteryWeights = Record<MasteryMetric, number>;

export type TopicProgressStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Mastered';
export type PhaseStatus = 'locked' | 'in-progress' | 'completed';

export interface LadderStageProgress {
  stage: LadderStage;
  progress: number;
  completed: boolean;
  unlocked: boolean;
  startedAt: string | null;
  completedAt: string | null;
}

export interface TopicProgress {
  userId: string;
  topicId: string;
  status: TopicProgressStatus;
  overallMastery: number;
  currentStage: LadderStage;
  metrics: MasteryMetrics;
  assessmentPassed: boolean;
  unlocked: boolean;
  ladder: LadderStageProgress[];
  startedAt: string | null;
  lastStudied: string | null;
  completedAt: string | null;
}

export interface Mastery {
  topicId: string;
  overallMastery: number;
  status: TopicProgressStatus;
  metrics: MasteryMetrics;
  weights: MasteryWeights;
  ladder: LadderStageProgress[];
}

export interface TopicOverlay {
  topicId: string;
  phaseId: string;
  order: number;
  status: TopicProgressStatus;
  mastery: number;
  confidence: number;
  assessmentPassed: boolean;
  unlocked: boolean;
  currentStage: LadderStage;
}

export interface PhaseProgress {
  phaseId: string;
  status: PhaseStatus;
  completionPercent: number;
  mastery: number;
  topicsCompleted: number;
  topicsTotal: number;
  estimatedTimeSpentHours: number;
  completedAt: string | null;
}

export interface OverallProgress {
  topicsTotal: number;
  topicsCompleted: number;
  topicsRemaining: number;
  phasesTotal: number;
  phasesCompleted: number;
  completionPercent: number;
  overallMastery: number;
  averageTopicMastery: number;
  averageConfidence: number;
}

/** Response of GET /progress (named to avoid clashing with the Sprint 1 `Progress`). */
export interface LearningProgress {
  overall: OverallProgress;
  currentPhaseId: string | null;
  currentTopicId: string | null;
  currentStage: LadderStage;
  phases: PhaseProgress[];
  topics: TopicOverlay[];
}

export type RecommendationType =
  | 'start-learning'
  | 'continue-topic'
  | 'complete-assessment'
  | 'next-topic'
  | 'phase-reflection';

export interface Recommendation {
  type: RecommendationType;
  title: string;
  message: string;
  topicId: string | null;
  phaseId: string | null;
  actionLabel: string;
  actionTo: string;
}

export interface LearningState {
  userId: string;
  currentPhase: PhaseRef | null;
  currentTopic: TopicSummary | null;
  currentStage: LadderStage | null;
  currentMastery: number;
  overall: OverallProgress;
  recommendation: Recommendation;
}

export interface RoadmapStats {
  totalPhases: number;
  unlockedPhases: number;
  completedPhases: number;
  totalTopics: number;
  totalEstimatedWeeks: number;
  totalEstimatedProblems: number;
}

export interface Roadmap {
  phases: Phase[];
  stats: RoadmapStats;
  progress: Progress;
}

/** Success envelope returned by every backend endpoint. */
export interface ApiEnvelope<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}
