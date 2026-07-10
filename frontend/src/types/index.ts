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

/* ---- Sprint 4: Dashboard aggregation ---- */

export type ActivityType =
  | 'topic-started'
  | 'topic-completed'
  | 'topic-mastered'
  | 'topic-unlocked'
  | 'mastery-updated'
  | 'phase-unlocked'
  | 'phase-completed'
  | 'attempt-started'
  | 'attempt-updated'
  | 'problem-solved'
  | 'notebook-created'
  | 'notebook-updated'
  | 'problem-documented'
  | 'recommendation-updated'
  | 'revision-scheduled'
  | 'revision-due'
  | 'revision-overdue'
  | 'revision-started'
  | 'revision-paused'
  | 'revision-resumed'
  | 'revision-completed'
  | 'revision-notes-updated'
  | 'confidence-increased'
  | 'confidence-decreased'
  | 'retention-updated'
  | 'knowledge-strengthened'
  | 'knowledge-at-risk'
  | 'insight-generated'
  | 'pattern-improved'
  | 'pattern-at-risk'
  | 'recommendation-created'
  | 'contest-added'
  | 'contest-updated'
  | 'rating-updated'
  | 'contest-started'
  | 'contest-finished'
  | 'contest-problem-solved'
  | 'contest-reflected'
  | 'upsolve-created'
  | 'upsolve-completed'
  | 'contest-knowledge-added'
  | 'learning-goal-created'
  | 'contest-readiness-updated'
  | 'competitive-insight-generated'
  | 'rating-milestone-reached'
  | 'weak-pattern-detected';

export type ActivityEntityType = 'topic' | 'phase' | 'problem' | 'revision' | 'contest';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  entityType: ActivityEntityType;
  entityId: string | null;
  title: string;
  description: string;
  createdAt: string;
}

export type RoadmapPhaseState = 'completed' | 'current' | 'unlocked' | 'locked';

export interface RoadmapSummaryPhase {
  phaseId: string;
  title: string;
  slug: string;
  order: number;
  color: string;
  icon: string;
  state: RoadmapPhaseState;
  completionPercent: number;
  topicsCompleted: number;
  topicsTotal: number;
  mastery: number;
}

export interface DashboardPhaseProgress extends PhaseProgress {
  phase: PhaseRef;
  estimatedTotalHours: number;
  estimatedTimeRemainingHours: number;
}

/* Sprint 4 — Learning-OS dashboard blocks. */

export interface DashboardKnowledge {
  knowledgeEntries: number;
  representativeProblems: number;
  patternsLearned: number;
  patternsPending: number;
  topicsCovered: number;
  notebookCoveragePercent: number;
}

export type PlanPriority = 'high' | 'medium' | 'low';

export interface DashboardTodayPlan {
  recommendation: Recommendation;
  currentTopic: TopicSummary | null;
  revisionsDue: number;
  estimatedStudyMinutes: number;
  estimatedRevisionMinutes: number;
  priority: PlanPriority;
  headline: string;
}

export type HealthStatus = 'excellent' | 'good' | 'fair' | 'at-risk';
export type HealthKey = 'learning' | 'knowledge' | 'revision' | 'retention';

export interface HealthIndicator {
  key: HealthKey;
  label: string;
  score: number;
  status: HealthStatus;
  detail: string;
}

export interface DashboardHealth {
  overallScore: number;
  overallStatus: HealthStatus;
  indicators: HealthIndicator[];
  confidence: number;
  topicsAtRisk: number;
  masteredTopics: number;
  upcomingReviews: number;
}

export type QuickActionKind =
  | 'continue-learning'
  | 'resume-session'
  | 'start-revision'
  | 'open-topic'
  | 'view-notebook'
  | 'view-calendar'
  | 'view-retention';

export interface QuickAction {
  kind: QuickActionKind;
  label: string;
  to: string;
  enabled: boolean;
  primary: boolean;
}

/** Response of GET /dashboard — the aggregated learner home screen. */
export interface Dashboard {
  userId: string;
  currentPhase: PhaseRef | null;
  currentTopic: TopicSummary | null;
  currentStage: LadderStage | null;
  currentMastery: number;
  overall: OverallProgress;
  recommendation: Recommendation;
  recommendedTopic: TopicSummary | null;
  currentPhaseProgress: DashboardPhaseProgress | null;
  roadmap: RoadmapSummaryPhase[];
  recentActivity: ActivityEvent[];
  revision: DashboardRevision;
  retention: DashboardRetention;
  knowledge: DashboardKnowledge;
  todayPlan: DashboardTodayPlan;
  health: DashboardHealth;
  quickActions: QuickAction[];
  contest: DashboardContest;
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

/* ---- Module 2 · Sprint 1: Problem Library ---- */

export type ProblemStatus = 'Not Started' | 'In Progress' | 'Solved';

/** A problem as it appears in the library list/table/grid. */
export interface ProblemListItem {
  id: string;
  title: string;
  slug: string;
  platform: Platform;
  platformProblemId: string;
  url: string;
  difficulty: Difficulty;
  pattern: string;
  tags: string[];
  representative: boolean;
  estimatedSolveTime: number;
  phaseId: string;
  topicId: string;
  editorialUrl?: string;
  status: ProblemStatus;
  favorite: boolean;
}

/** Lightweight topic reference embedded in a problem detail. */
export interface TopicRef {
  id: string;
  title: string;
  slug: string;
  phaseId: string;
}

export interface ProblemDetail extends ProblemListItem {
  topic: TopicRef | null;
  phase: PhaseRef | null;
  lastViewed: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Response of GET /problems — items plus pagination metadata. */
export interface PaginatedProblems {
  items: ProblemListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export type ProblemSortField = 'difficulty' | 'title' | 'estimatedSolveTime' | 'platform' | 'recent';

/** Query accepted by the library list/search (all fields optional). */
export interface ProblemsQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  platform?: Platform;
  difficulty?: Difficulty;
  phase?: string;
  topic?: string;
  pattern?: string;
  status?: ProblemStatus;
  representative?: boolean;
  favorite?: boolean;
  sort?: ProblemSortField;
  order?: 'asc' | 'desc';
}

/** Available filter values returned by GET /problems/facets. */
export interface ProblemFacets {
  platforms: Platform[];
  difficulties: Difficulty[];
  patterns: string[];
  statuses: ProblemStatus[];
}

/* ---- Module 2 · Sprint 2: Attempt Tracking ---- */

export type AttemptStatus = 'Started' | 'Solved' | 'Abandoned';
export type AttemptVerdict =
  | 'Accepted'
  | 'Wrong Answer'
  | 'TLE'
  | 'MLE'
  | 'RE'
  | 'CE'
  | 'Unknown';
export type AttemptLanguage =
  | 'C++'
  | 'C'
  | 'Python'
  | 'Java'
  | 'JavaScript'
  | 'TypeScript'
  | 'Go'
  | 'Rust'
  | 'Kotlin'
  | 'C#'
  | 'Other';

export interface Attempt {
  id: string;
  userId: string;
  problemId: string;
  attemptNumber: number;
  status: AttemptStatus;
  verdict: AttemptVerdict;
  language: AttemptLanguage;
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
  wrongAttempts: number;
  usedHint: boolean;
  usedEditorial: boolean;
  contestAttempt: boolean;
  upsolved: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttemptSummary {
  problemId: string;
  totalAttempts: number;
  solved: boolean;
  solvedCount: number;
  firstSolvedAt: string | null;
  latestAttemptAt: string | null;
  totalTimeSpent: number;
  averageSolveTime: number;
  hintUsageCount: number;
  editorialUsageCount: number;
  solvedWithoutHint: boolean;
  solvedWithoutEditorial: boolean;
  latestAttempt: Attempt | null;
}

/** Body for POST /attempts. */
export interface CreateAttemptInput {
  problemId: string;
  status: AttemptStatus;
  verdict: AttemptVerdict;
  language: AttemptLanguage;
  startTime: string;
  endTime?: string | null;
  durationMinutes?: number;
  wrongAttempts?: number;
  usedHint?: boolean;
  usedEditorial?: boolean;
  contestAttempt?: boolean;
  upsolved?: boolean;
  notes?: string;
}

/** Body for PATCH /attempts/:id (all optional). */
export type UpdateAttemptInput = Partial<Omit<CreateAttemptInput, 'problemId'>>;

/* ---- Module 2 · Sprint 3: Pattern Notebook ---- */

export interface NotebookAlternative {
  title: string;
  detail: string;
}

export interface RelatedProblemRef {
  id: string;
  title: string;
  slug: string;
  pattern: string;
  difficulty: Difficulty;
  platform: Platform;
  topicId: string;
  topicTitle: string;
}

export interface NotebookRef {
  id: string;
  problemId: string;
  title: string;
  pattern: string;
  confidence: number;
}

export interface NotebookListItem {
  id: string;
  problemId: string;
  topicId: string;
  phaseId: string;
  title: string;
  pattern: string;
  platform: Platform;
  topicTitle: string;
  confidence: number;
  revisionCount: number;
  relatedCount: number;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotebookDetail {
  id: string;
  userId: string;
  problemId: string;
  topicId: string;
  phaseId: string;
  title: string;
  platform: Platform;
  pattern: string;
  recognitionKeywords: string[];
  observation: string;
  coreAlgorithm: string;
  timeComplexity: string;
  spaceComplexity: string;
  alternativeSolutions: NotebookAlternative[];
  commonMistakes: string[];
  lessonsLearned: string;
  personalNotes: string;
  confidence: number;
  revisionDates: string[];
  revisionCount: number;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  topic: TopicRef | null;
  phase: PhaseRef | null;
  relatedProblems: RelatedProblemRef[];
  relatedEntries: NotebookRef[];
}

export interface PaginatedNotebook {
  items: NotebookListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface NotebookFacets {
  patterns: string[];
  platforms: Platform[];
}

export type NotebookSortField = 'recent' | 'confidence' | 'reviewed' | 'alpha';

export interface NotebookQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  pattern?: string;
  topic?: string;
  phase?: string;
  platform?: Platform;
  problem?: string;
  tag?: string;
  confidenceMin?: number;
  confidenceMax?: number;
  sort?: NotebookSortField;
  order?: 'asc' | 'desc';
}

/** Body for POST /notebook (problemId required; rest pre-filled from the problem). */
export interface CreateNotebookInput {
  problemId: string;
  title?: string;
  pattern?: string;
  platform?: Platform;
  recognitionKeywords?: string[];
  observation?: string;
  coreAlgorithm?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  alternativeSolutions?: NotebookAlternative[];
  commonMistakes?: string[];
  lessonsLearned?: string;
  personalNotes?: string;
  confidence?: number;
  relatedProblems?: string[];
  relatedEntries?: string[];
}

/** Body for PATCH /notebook/:id (all optional; `review` appends a revision). */
export type UpdateNotebookInput = Partial<Omit<CreateNotebookInput, 'problemId'>> & {
  review?: boolean;
};

/* ---- Module 2 · Sprint 4: Learning Integration & Workspace ---- */

export type ProblemLearningStatus =
  | 'Not Started'
  | 'Learning'
  | 'Attempting'
  | 'Solved'
  | 'Mastered';

export interface NotebookRefLite {
  id: string;
  pattern: string;
  confidence: number;
  revisionCount: number;
  hasMetadata: boolean;
  updatedAt: string;
}

export interface LearningSummary {
  topic: TopicRef | null;
  phase: PhaseRef | null;
  topicMastery: number;
  pattern: string;
  representative: boolean;
  confidence: number | null;
  problemStatus: ProblemLearningStatus;
  recommendation: Recommendation;
}

export interface TopicProgressSnapshot {
  topicId: string;
  status: string;
  mastery: number;
  completionPercent: number;
  topicsCompleted: number;
  topicsTotal: number;
}

export interface DashboardImpact {
  overallMastery: number;
  completionPercent: number;
  topicsCompleted: number;
  topicsRemaining: number;
}

export interface LearningImpact {
  problemId: string;
  currentMastery: number;
  masteryBefore: number | null;
  masteryDelta: number | null;
  topicCompleted: boolean;
  topicProgress: TopicProgressSnapshot | null;
  dashboard: DashboardImpact;
  recommendation: Recommendation;
  alreadyCompleted?: boolean;
}

export interface ProblemWorkspace {
  problem: ProblemDetail;
  attemptSummary: AttemptSummary;
  notebook: NotebookRefLite | null;
  learningStatus: ProblemLearningStatus;
  learningSummary: LearningSummary;
  learningImpact: LearningImpact;
  relatedProblems: RelatedProblemRef[];
  activity: ActivityEvent[];
}

export interface CompleteProblemInput {
  language?: AttemptLanguage;
  durationMinutes?: number;
  notes?: string;
}

/* ---- Module 3 · Sprint 1: Revision Engine ---- */

export type RevisionEntityType = 'topic' | 'pattern' | 'knowledgeEntry';
export type RevisionStatus = 'Pending' | 'Due' | 'Completed' | 'Overdue' | 'Archived';
export type RevisionUrgency = 'overdue' | 'due' | 'upcoming';

export interface RevisionSchedule {
  id: string;
  userId: string;
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  currentInterval: number;
  nextReviewDate: string;
  lastReviewDate: string | null;
  reviewCount: number;
  easeFactor: number;
  priority: number;
  strategy: string;
  status: RevisionStatus;
  urgency: RevisionUrgency;
  daysUntilReview: number;
  estimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface RevisionQueueSummary {
  dueTodayCount: number;
  overdueCount: number;
  upcomingCount: number;
  totalScheduled: number;
  estimatedReviewMinutes: number;
}

export interface RevisionQueue {
  overdue: RevisionSchedule[];
  dueToday: RevisionSchedule[];
  upcoming: RevisionSchedule[];
  summary: RevisionQueueSummary;
}

export interface RevisionCalendarItem {
  id: string;
  title: string;
  entityType: RevisionEntityType;
  urgency: RevisionUrgency;
  priority: number;
}

export interface RevisionCalendarDay {
  date: string;
  overdue: number;
  due: number;
  upcoming: number;
  total: number;
  items: RevisionCalendarItem[];
}

export interface RevisionCalendar {
  from: string;
  to: string;
  days: RevisionCalendarDay[];
}

export interface DashboardRevision {
  dueTodayCount: number;
  overdueCount: number;
  upcomingCount: number;
  totalScheduled: number;
  estimatedReviewMinutes: number;
  preview: RevisionSchedule[];
  // --- Sprint 2: active-session block ---
  activeSession: RevisionSession | null;
  completedToday: number;
  recentSessions: RevisionSession[];
}

export type RevisionSortField = 'nextReviewDate' | 'priority' | 'createdAt' | 'title';

export interface RevisionQuery {
  page?: number;
  pageSize?: number;
  status?: RevisionStatus;
  entityType?: RevisionEntityType;
  from?: string;
  to?: string;
  sort?: RevisionSortField;
  order?: 'asc' | 'desc';
}

export interface PaginatedRevisionSchedules {
  items: RevisionSchedule[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CreateScheduleInput {
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  strategy?: string;
  priority?: number;
  nextReviewDate?: string;
  allowDuplicate?: boolean;
}

export interface UpdateScheduleInput {
  title?: string;
  priority?: number;
  status?: 'Pending' | 'Completed' | 'Archived';
  strategy?: string;
  nextReviewDate?: string;
}

/* ---- Module 3 · Sprint 2: Revision Sessions & Workspace ---- */

export type RevisionSessionStatus = 'Started' | 'Completed' | 'Abandoned';

export interface RevisionSession {
  id: string;
  userId: string;
  revisionScheduleId: string | null;
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  sessionStatus: RevisionSessionStatus;
  startedAt: string;
  completedAt: string | null;
  durationMinutes: number;
  reviewedKnowledgeEntries: string[];
  reviewedProblems: string[];
  reviewNotes: string;
  selfConfidenceBefore: number | null;
  selfConfidenceAfter: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface RevisionContent {
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  pattern: string;
  topic: TopicRef | null;
  phase: PhaseRef | null;
  recognitionKeywords: string[];
  coreIdea: string;
  coreAlgorithm: string;
  whenToUse: string;
  whenNotToUse: string;
  timeComplexity: string;
  spaceComplexity: string;
  commonMistakes: string[];
  contestTraps: string[];
  alternativeSolutions: NotebookAlternative[];
  representativeProblems: RelatedProblemRef[];
  relatedProblems: RelatedProblemRef[];
  knowledgeNotes: string;
  confidence: number | null;
  estimatedReviewMinutes: number;
  hasNotebook: boolean;
  notebookId: string | null;
}

export interface RevisionWorkspace {
  content: RevisionContent;
  activeSession: RevisionSession | null;
  schedule: RevisionSchedule | null;
}

export type SessionHistorySort = 'recent' | 'oldest' | 'duration';

export interface SessionHistoryQuery {
  page?: number;
  pageSize?: number;
  entityType?: RevisionEntityType;
  status?: RevisionSessionStatus;
  from?: string;
  to?: string;
  sort?: SessionHistorySort;
}

export interface PaginatedSessions {
  items: RevisionSession[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface StartSessionInput {
  scheduleId?: string;
  entityType?: RevisionEntityType;
  entityId?: string;
  selfConfidenceBefore?: number;
}

export interface CompleteSessionInput {
  sessionId: string;
  durationMinutes?: number;
  reviewNotes?: string;
  selfConfidenceAfter?: number;
  reviewedKnowledgeEntries?: string[];
  reviewedProblems?: string[];
}

export interface UpdateSessionInput {
  reviewNotes?: string;
  selfConfidenceBefore?: number;
  selfConfidenceAfter?: number;
  reviewedKnowledgeEntries?: string[];
  reviewedProblems?: string[];
  action?: 'pause' | 'resume' | 'abandon';
}

/* ---- Module 3 · Sprint 3: Retention Engine, Confidence Decay & Mastery Sync ---- */

export type RetentionLevel =
  | 'Learning'
  | 'Familiar'
  | 'Strong'
  | 'Mastered'
  | 'Needs Review'
  | 'At Risk';

export type ConfidenceTrendDirection = 'rising' | 'falling' | 'stable';

export interface RetentionSnapshot {
  confidenceScore: number;
  retentionScore: number;
  level: RetentionLevel;
  reason: string;
  date: string;
}

export interface ConfidenceTrend {
  direction: ConfidenceTrendDirection;
  delta: number;
  series: { date: string; value: number }[];
}

export interface RetentionProfile {
  id: string;
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  topicId: string | null;
  confidenceScore: number;
  retentionScore: number;
  decayScore: number;
  currentLevel: RetentionLevel;
  reviewCount: number;
  successfulReviews: number;
  missedReviews: number;
  overdueReviews: number;
  averageReviewInterval: number;
  successRate: number;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  daysUntilReview: number | null;
  isOverdue: boolean;
  strategy: string;
  confidenceTrend: ConfidenceTrend;
  history: RetentionSnapshot[];
  createdAt: string;
  updatedAt: string;
}

export interface RetentionProfileRef {
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  topicId: string | null;
  confidenceScore: number;
  retentionScore: number;
  currentLevel: RetentionLevel;
}

export interface RetentionOverview {
  totalProfiles: number;
  averageConfidence: number;
  averageRetention: number;
  masteredCount: number;
  strongCount: number;
  familiarCount: number;
  learningCount: number;
  needsReviewCount: number;
  atRiskCount: number;
  overdueReviews: number;
  revisionSuccessRate: number;
  confidenceTrend: ConfidenceTrend;
  atRisk: RetentionProfileRef[];
}

export interface ConfidenceEntry {
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  confidenceScore: number;
  trend: ConfidenceTrendDirection;
  currentLevel: RetentionLevel;
}

export interface ConfidenceOverview {
  averageConfidence: number;
  trend: ConfidenceTrend;
  entries: ConfidenceEntry[];
}

export interface RetentionHistoryRow {
  entityType: RevisionEntityType;
  entityId: string;
  title: string;
  snapshot: RetentionSnapshot;
}

export interface DashboardRetention {
  averageConfidence: number;
  averageRetention: number;
  atRiskCount: number;
  needsReviewCount: number;
  masteredCount: number;
  overdueReviews: number;
  revisionSuccessRate: number;
  trendDirection: ConfidenceTrendDirection;
  trendDelta: number;
}

export interface UpdateRetentionInput {
  confidenceScore: number;
}

/* ---- Module 4 · Sprint 1: Analytics Infrastructure ---- */

export type AnalyticsRange = '7d' | '30d' | '90d' | '180d' | '365d' | 'all';

export interface DistributionSlice<K extends string = string> {
  key: K;
  count: number;
  percent: number;
}

export interface TimePoint {
  date: string;
  count: number;
}

export interface PhaseProgressSlice {
  phaseId: string;
  title: string;
  completionPercent: number;
  mastery: number;
  topicsCompleted: number;
  topicsTotal: number;
}

export interface LearningSummary {
  topicsCompleted: number;
  topicsRemaining: number;
  topicsTotal: number;
  phasesCompleted: number;
  phasesTotal: number;
  completionPercent: number;
  averageMastery: number;
  averageConfidence: number;
  learningVelocityPerWeek: number;
  learningTimeHours: number;
  phaseProgress: PhaseProgressSlice[];
}

export interface ProblemSummary {
  totalProblems: number;
  solvedProblems: number;
  attemptedProblems: number;
  successRate: number;
  averageSolveTimeMinutes: number;
  platformDistribution: DistributionSlice<Platform>[];
  difficultyDistribution: DistributionSlice<Difficulty>[];
}

export interface KnowledgeSummaryAnalytics {
  notebookEntries: number;
  representativeProblems: number;
  patternsLearned: number;
  topicsCovered: number;
  coveragePercent: number;
  documentationRate: number;
  averageConfidence: number;
}

export interface RevisionSummaryAnalytics {
  reviewsCompleted: number;
  overdueReviews: number;
  totalScheduled: number;
  reviewFrequencyPerWeek: number;
  averageReviewDurationMinutes: number;
  revisionConsistencyPercent: number;
}

export interface RetentionSummaryAnalytics {
  averageRetention: number;
  averageConfidence: number;
  knowledgeHealthPercent: number;
  atRiskTopics: number;
  masteredTopics: number;
  needsReviewTopics: number;
  totalTracked: number;
}

export interface ActivitySummary {
  totalActivities: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  dailyActivity: TimePoint[];
  weeklyActivity: TimePoint[];
  monthlyActivity: TimePoint[];
}

export interface AnalyticsOverview {
  learning: LearningSummary;
  problems: ProblemSummary;
  knowledge: KnowledgeSummaryAnalytics;
  revision: RevisionSummaryAnalytics;
  retention: RetentionSummaryAnalytics;
  activity: ActivitySummary;
}

/* ---- Module 4 · Sprint 3: Pattern Intelligence & Insights ---- */

export type PatternStatus = 'strong' | 'developing' | 'needs-work';
export type Severity = 'high' | 'medium' | 'low';
export type TrendDirection = 'increasing' | 'stable' | 'declining';
export type InsightType = 'strength' | 'weakness' | 'trend' | 'milestone';
export type InsightTone = 'positive' | 'negative' | 'neutral';
export type Priority = 'high' | 'medium' | 'low';
export type ImpactLevel = 'high' | 'medium' | 'low';

export interface PatternMatrix {
  understanding: number;
  recognition: number;
  implementation: number;
  optimization: number;
  contestReadiness: number;
  confidence: number;
  retention: number;
  overallMastery: number;
}

export interface PatternProfile {
  patternId: string;
  title: string;
  phaseId: string;
  phaseTitle: string;
  status: PatternStatus;
  isWeak: boolean;
  isStrong: boolean;
  matrix: PatternMatrix;
  attemptSuccessRate: number;
  averageSolveTimeMinutes: number;
  revisionSuccessRate: number;
  hintDependency: number;
  editorialDependency: number;
  problemsSolved: number;
  problemsAttempted: number;
  reviewCount: number;
  confidenceTrendDirection: 'rising' | 'falling' | 'stable';
  confidenceTrendDelta: number;
  overall: number;
  updatedAt: string | null;
}

export interface Weakness {
  id: string;
  category: string;
  severity: Severity;
  title: string;
  detail: string;
  entityType: 'topic' | 'pattern' | 'knowledgeEntry' | 'global';
  entityId: string | null;
  metric: string;
  value: number;
  threshold: number;
  recommendationHint: string;
}

export interface Strength {
  id: string;
  category: string;
  title: string;
  detail: string;
  entityType: 'topic' | 'pattern' | 'knowledgeEntry' | 'global';
  entityId: string | null;
  metric: string;
  value: number;
}

export interface Trend {
  key: string;
  label: string;
  current: number;
  previous: number;
  delta: number;
  direction: TrendDirection;
  unit: string;
}

export interface LearningInsight {
  id: string;
  type: InsightType;
  tone: InsightTone;
  title: string;
  message: string;
  entityType: 'topic' | 'pattern' | 'knowledgeEntry' | 'phase' | 'global';
  entityId: string | null;
  priority: Priority;
}

export interface AnalyticsRecommendation {
  id: string;
  priority: Priority;
  title: string;
  reason: string;
  suggestedAction: string;
  actionType: 'open-topic' | 'start-revision' | 'review-notebook' | 'practice-problems';
  to: string;
  estimatedTimeMinutes: number;
  learningImpact: ImpactLevel;
  entityType: 'topic' | 'pattern' | 'knowledgeEntry' | 'global';
  entityId: string | null;
}

/* ---- Module 4 · Sprint 4: Executive Dashboard & Reports ---- */

export type ScoreStatus = 'excellent' | 'good' | 'fair' | 'at-risk';

export interface ExecutiveScores {
  learning: number;
  knowledge: number;
  retention: number;
  revision: number;
  productivity: number;
  overallReadiness: number;
}

export interface ScoreBreakdown {
  key: string;
  label: string;
  score: number;
  status: ScoreStatus;
}

export interface ExecutiveProgress {
  completionPercent: number;
  overallMastery: number;
  averageRetention: number;
  learningVelocityPerWeek: number;
  knowledgeCoveragePercent: number;
  revisionConsistencyPercent: number;
}

export interface Executive {
  scores: ExecutiveScores;
  breakdown: ScoreBreakdown[];
  progress: ExecutiveProgress;
  currentPhase: { id: string; title: string; completionPercent: number } | null;
  currentTopic: { id: string; title: string } | null;
  patternHealth: { strong: number; developing: number; needsWork: number; total: number };
  insights: LearningInsight[];
  recommendations: AnalyticsRecommendation[];
}

export type ReportKind = 'weekly' | 'monthly' | 'summary' | 'phase';

export interface ReportMeta {
  kind: ReportKind;
  title: string;
  periodLabel: string;
  from: string | null;
  to: string;
  generatedAt: string;
}

export interface ReportMetric {
  label: string;
  value: string;
  hint?: string;
}

export interface Achievement {
  title: string;
  description: string;
}

export interface Report {
  meta: ReportMeta;
  scores: ExecutiveScores;
  summary: string;
  keyMetrics: ReportMetric[];
  overview: AnalyticsOverview;
  trends: Trend[];
  achievements: Achievement[];
  strengths: Strength[];
  weaknesses: Weakness[];
  recommendations: AnalyticsRecommendation[];
  nextGoals: string[];
}

export interface PhaseReport extends Report {
  phase: {
    id: string;
    title: string;
    completionPercent: number;
    mastery: number;
    topicsCompleted: number;
    topicsTotal: number;
  };
  patterns: PatternProfile[];
  estimatedReadiness: number;
  readinessLabel: string;
}

export type ExportFormat = 'pdf' | 'markdown' | 'json' | 'csv';

/* ---- Module 5 · Sprint 1: Competitive Programming Engine ---- */

export type ContestPlatform = 'Codeforces' | 'LeetCode' | 'AtCoder' | 'CodeChef';
export type ContestType = 'Rated' | 'Unrated' | 'Virtual';
export type ContestSortField = 'startTime' | 'ratingChange' | 'rank' | 'contestName' | 'createdAt';

export interface Contest {
  id: string;
  platform: ContestPlatform;
  provider: string;
  contestId: string;
  contestName: string;
  contestUrl: string;
  division: string;
  contestType: ContestType;
  startTime: string;
  durationMinutes: number;
  ratingBefore: number | null;
  ratingAfter: number | null;
  ratingChange: number | null;
  rank: number | null;
  percentile: number | null;
  participated: boolean;
  notes: string;
  isRated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedContests {
  items: Contest[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ContestFacets {
  platforms: { platform: ContestPlatform; label: string; divisions: string[] }[];
  contestTypes: ContestType[];
  usedPlatforms: string[];
  usedDivisions: string[];
}

export interface ContestStats {
  totalContests: number;
  ratedContests: number;
  virtualContests: number;
  participatedContests: number;
  averageRank: number;
  averageRatingChange: number;
  participationFrequencyPerMonth: number;
  platformDistribution: { platform: string; count: number; percent: number }[];
}

export interface RatingHistoryPoint {
  contestId: string;
  contestName: string;
  platform: ContestPlatform;
  rating: number;
  ratingChange: number;
  date: string;
}

export interface RatingSummary {
  currentRating: number | null;
  highestRating: number | null;
  lowestRating: number | null;
  averageRating: number | null;
  bestImprovement: number;
  worstDrop: number;
  ratedContests: number;
  lastRatingChange: number | null;
  recentChanges: { contestName: string; ratingChange: number; date: string }[];
}

export interface DashboardContest {
  totalContests: number;
  currentRating: number | null;
  highestRating: number | null;
  latestContest: Contest | null;
  recentRatingChange: number | null;
  averageRank: number;
  latestPerformance: { totalSolved: number; wrongAttempts: number; penalty: number; averageSolveTime: number } | null;
  pendingUpsolve: number;
  contestReadiness: number | null;
}

export interface ContestQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  platform?: ContestPlatform;
  contestType?: ContestType;
  division?: string;
  rated?: boolean;
  from?: string;
  to?: string;
  sort?: ContestSortField;
  order?: 'asc' | 'desc';
}

export interface CreateContestInput {
  platform: ContestPlatform;
  contestId: string;
  contestName: string;
  contestUrl?: string;
  division?: string;
  contestType: ContestType;
  startTime: string;
  durationMinutes?: number;
  ratingBefore?: number | null;
  ratingAfter?: number | null;
  rank?: number | null;
  percentile?: number | null;
  participated?: boolean;
  notes?: string;
}

export type UpdateContestInput = Partial<Omit<CreateContestInput, 'platform' | 'contestId'>>;

/* ---- Module 5 · Sprint 2: Contest Workspace ---- */

export type ContestEventType =
  | 'contest-started'
  | 'problem-opened'
  | 'submission'
  | 'accepted'
  | 'wrong-answer'
  | 'tle'
  | 'mle'
  | 're'
  | 'skipped'
  | 'contest-finished';

export type ContestProblemStatus = 'solved' | 'attempted' | 'skipped' | 'unattempted';

export interface ContestProblem {
  id: string;
  contestRef: string;
  problemCode: string;
  problemName: string;
  platformProblemId: string;
  url: string;
  index: string;
  difficulty: string;
  tags: string[];
  solved: boolean;
  skipped: boolean;
  attempted: boolean;
  attempts: number;
  firstAttemptAt: string | null;
  solvedAt: string | null;
  totalTimeSpent: number;
  penalty: number;
  status: ContestProblemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ContestTimelineEvent {
  id: string;
  contestRef: string;
  timestamp: string;
  eventType: ContestEventType;
  problemRef: string | null;
  problemCode: string;
  description: string;
  offsetMinutes: number | null;
}

export interface ContestPerformance {
  contestRef: string;
  totalSolved: number;
  totalAttempts: number;
  wrongAttempts: number;
  penalty: number;
  averageSolveTime: number;
  fastestSolve: number | null;
  slowestSolve: number | null;
  contestDurationMinutes: number;
  problemSuccessRate: number;
  solvedProblems: string[];
  unsolvedProblems: string[];
  skippedProblems: string[];
}

export interface ContestStatistics {
  acceptanceRate: number;
  problemsAttempted: number;
  problemsSkipped: number;
  averageAttempts: number;
  averageSolveTime: number;
  contestEfficiency: number;
  contestPace: number;
}

export interface ContestWorkspace {
  contest: Contest;
  problems: ContestProblem[];
  performance: ContestPerformance;
  timeline: ContestTimelineEvent[];
  statistics: ContestStatistics;
  notes: string;
}

export interface CreateContestProblemInput {
  problemCode: string;
  problemName: string;
  platformProblemId?: string;
  url?: string;
  index?: string;
  difficulty?: string;
  tags?: string[];
  solved?: boolean;
  skipped?: boolean;
  attempted?: boolean;
  attempts?: number;
  firstAttemptAt?: string | null;
  solvedAt?: string | null;
  totalTimeSpent?: number;
  penalty?: number;
}

export type UpdateContestProblemInput = Partial<Omit<CreateContestProblemInput, 'problemCode'>>;

export interface CreateTimelineEventInput {
  eventType: ContestEventType;
  timestamp?: string;
  problemRef?: string | null;
  problemCode?: string;
  description?: string;
}

/* ---- Module 5 · Sprint 3: Contest Learning Engine ---- */

export type UpsolveStatus = 'Pending' | 'In Progress' | 'Completed' | 'Skipped';
export type UpsolvePriority = 'high' | 'medium' | 'low';

export interface LearningGoal {
  text: string;
  topicId: string | null;
  done: boolean;
}

export interface ContestPostmortem {
  id: string;
  contestRef: string;
  overallPerformance: string;
  whatWentWell: string;
  whatWentWrong: string;
  biggestMistake: string;
  biggestLearning: string;
  nextFocus: string;
  timeManagementNotes: string;
  strengths: string[];
  weaknesses: string[];
  missedPatterns: string[];
  implementationMistakes: string[];
  debuggingMistakes: string[];
  algorithmGaps: string[];
  learningGoals: LearningGoal[];
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export type UpsertPostmortemInput = Partial<
  Pick<
    ContestPostmortem,
    | 'overallPerformance'
    | 'whatWentWell'
    | 'whatWentWrong'
    | 'biggestMistake'
    | 'biggestLearning'
    | 'nextFocus'
    | 'timeManagementNotes'
    | 'strengths'
    | 'weaknesses'
    | 'missedPatterns'
    | 'implementationMistakes'
    | 'debuggingMistakes'
    | 'algorithmGaps'
    | 'summary'
  >
> & { learningGoals?: { text: string; topicId?: string | null; done?: boolean }[] };

export interface UpsolveTask {
  id: string;
  contestRef: string;
  contestProblemRef: string;
  topicId: string | null;
  pattern: string;
  priority: UpsolvePriority;
  status: UpsolveStatus;
  estimatedTime: number;
  linkedKnowledgeEntry: string | null;
  linkedRevisionSchedule: string | null;
  problemCode: string;
  problemName: string;
  url: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsolveQueue {
  pending: UpsolveTask[];
  inProgress: UpsolveTask[];
  completed: UpsolveTask[];
  skipped: UpsolveTask[];
  counts: { pending: number; inProgress: number; completed: number; skipped: number; total: number };
  estimatedRemainingMinutes: number;
}

export interface ContestPatternAnalysis {
  patternsSolved: string[];
  patternsMissed: string[];
  patternsToPractice: { pattern: string; topicId: string | null; reason: string }[];
}

export interface AlgorithmGap {
  label: string;
  detail: string;
  topicId: string | null;
  severity: 'high' | 'medium' | 'low';
}

export interface ContestLearning {
  contestRef: string;
  postmortem: ContestPostmortem | null;
  upsolve: UpsolveTask[];
  patternAnalysis: ContestPatternAnalysis;
  algorithmGaps: AlgorithmGap[];
  suggestedLearningGoals: string[];
}

export interface UpsolveQueryInput {
  status?: UpsolveStatus;
  priority?: UpsolvePriority;
  contestId?: string;
}

export interface UpdateUpsolveInput {
  status?: UpsolveStatus;
  priority?: UpsolvePriority;
  topicId?: string | null;
  pattern?: string;
  estimatedTime?: number;
}

/* ---- Module 5 · Sprint 4: Competitive Intelligence Engine ---- */

export type ReadinessStatus = 'ready' | 'developing' | 'early' | 'not-ready';
export type CorrelationDirection = 'positive' | 'negative' | 'neutral';
export type CorrelationStrength = 'strong' | 'moderate' | 'weak';

export interface RatingAnalysis {
  currentRating: number | null;
  highestRating: number | null;
  lowestRating: number | null;
  averageRating: number | null;
  ratingTrend: 'rising' | 'falling' | 'stable';
  ratingGrowth: number;
  averageRatingGain: number;
  largestGain: number;
  largestLoss: number;
  contestConsistency: number;
  ratedContests: number;
  timeline: { date: string; rating: number }[];
  platformStats: { platform: ContestPlatform; current: number | null; highest: number | null; contests: number }[];
}

export interface ReadinessSubScore {
  key: string;
  label: string;
  score: number;
  status: ReadinessStatus;
}

export interface ContestReadiness {
  overall: number;
  status: ReadinessStatus;
  breakdown: ReadinessSubScore[];
  strongAreas: string[];
  weakAreas: string[];
}

export interface CorrelationItem {
  key: string;
  label: string;
  xLabel: string;
  yLabel: string;
  xValue: number;
  yValue: number;
  direction: CorrelationDirection;
  strength: CorrelationStrength;
  insight: string;
}

export interface ContestCorrelation {
  items: CorrelationItem[];
}

export type CompetitiveInsightType = 'strength' | 'weakness' | 'opportunity' | 'improvement' | 'warning' | 'focus';

export interface CompetitiveInsight {
  id: string;
  type: CompetitiveInsightType;
  severity: 'high' | 'medium' | 'low';
  title: string;
  reason: string;
  suggestedAction: string;
  relatedTopics: { id: string; title: string }[];
}

export type CompetitiveActionType =
  | 'practice-contest'
  | 'virtual-contest'
  | 'upsolve'
  | 'revise-patterns'
  | 'strengthen-topic'
  | 'improve-speed';

export interface CompetitiveRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  reason: string;
  suggestedAction: string;
  actionType: CompetitiveActionType;
  to: string;
  estimatedTimeMinutes: number;
  learningImpact: 'high' | 'medium' | 'low';
}

export interface CompetitiveIntelligence {
  summary: {
    headline: string;
    overallReadiness: number;
    readinessStatus: ReadinessStatus;
    currentRating: number | null;
    ratingTrend: 'rising' | 'falling' | 'stable';
    pendingUpsolve: number;
  };
  strengths: Strength[];
  weaknesses: Weakness[];
  insights: CompetitiveInsight[];
  recommendations: CompetitiveRecommendation[];
  readiness: ContestReadiness;
  correlation: ContestCorrelation;
  ratingAnalysis: RatingAnalysis;
}

/* ---- Module 6 · Sprint 1: Gamification / Progression Engine ---- */

export type RewardType = 'xp' | 'badge' | 'achievement';
export type RewardSourceModule = 'learning' | 'revision' | 'knowledge' | 'contest';
export type LevelFormulaName = 'exponential' | 'linear';

/** The activity types that earn a reward (mirrors REWARDABLE_ACTIVITY_TYPES). */
export type RewardableActivityType =
  | 'problem-solved'
  | 'topic-completed'
  | 'phase-completed'
  | 'revision-completed'
  | 'notebook-created'
  | 'contest-finished'
  | 'upsolve-completed'
  | 'notebook-updated';

/** GET /api/gamification/progression */
export interface ProgressionSummary {
  level: number;
  tier: string;
  totalXP: number;
  currentXP: number;
  currentLevelXP: number;
  nextLevelXP: number;
  xpRemaining: number;
  levelProgress: number;
  isMaxLevel: boolean;
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  streakActive: boolean;
  lastActivityDate: string | null;
  todaysXP: number;
  updatedAt: string | null;
}

export interface Reward {
  id: string;
  activityId: string;
  rewardType: RewardType;
  rewardSource: string;
  xpAwarded: number;
  reason: string;
  module: RewardSourceModule | null;
  entityType: string | null;
  entityId: string | null;
  title: string | null;
  createdAt: string;
}

export interface RewardHistoryPage {
  items: Reward[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export type RewardSortOrder = 'newest' | 'oldest';

/** Query params for GET /rewards/history (all optional). */
export interface RewardHistoryQuery {
  rewardType?: RewardType;
  rewardSource?: string;
  from?: string;
  to?: string;
  sort?: RewardSortOrder;
  limit?: number;
  offset?: number;
}

export interface LevelLadderRow {
  level: number;
  xpForLevel: number;
  totalXpToReach: number;
  tier: string;
  isCurrent: boolean;
}

export interface Levels {
  formula: LevelFormulaName;
  baseXP: number;
  exponent: number;
  maxLevel: number;
  currentLevel: number;
  currentXP: number;
  nextLevelXP: number;
  levelProgress: number;
  ladder: LevelLadderRow[];
}

export interface DailyActivity {
  date: string;
  xp: number;
  rewards: number;
  active: boolean;
}

export interface Streaks {
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  streakActive: boolean;
  lastActivityDate: string | null;
  daysSinceLastActivity: number | null;
  daily: DailyActivity[];
}

/* ---- Module 6 · Sprint 2: Achievement System ---- */

export type AchievementRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';
export type ChallengeType = 'Daily' | 'Weekly' | 'Monthly' | 'Phase' | 'Custom';
export type ChallengeStatus = 'Active' | 'Completed' | 'Expired';
export type CelebrationType =
  | 'level-up'
  | 'achievement-unlocked'
  | 'badge-earned'
  | 'challenge-completed'
  | 'milestone-reached';

export interface Achievement {
  id: string;
  achievementKey: string;
  title: string;
  description: string;
  category: string;
  rarity: AchievementRarity;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  maxProgress: number;
  percent: number;
  metadata: Record<string, unknown>;
}

export interface Badge {
  id: string;
  badgeKey: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  unlockedAt: string;
}

export interface Challenge {
  id: string;
  challengeKey: string;
  title: string;
  description: string;
  challengeType: ChallengeType;
  activityType: string;
  targetValue: number;
  currentProgress: number;
  remaining: number;
  percent: number;
  rewardXP: number;
  rewardBadge: string | null;
  status: ChallengeStatus;
  expiresAt: string;
  secondsRemaining: number;
  completedAt: string | null;
}

export interface ChallengesGrouped {
  active: Challenge[];
  completed: Challenge[];
  byType: Record<ChallengeType, Challenge[]>;
}

export interface Celebration {
  id: string;
  type: CelebrationType;
  title: string;
  description: string;
  icon: string;
  rarity: string | null;
  xp: number;
  metadata: Record<string, unknown>;
  seen: boolean;
  createdAt: string;
}

export interface GamificationProfile {
  progression: ProgressionSummary;
  achievements: {
    unlocked: number;
    total: number;
    recent: Achievement[];
    inProgress: Achievement[];
  };
  badges: {
    count: number;
    recent: Badge[];
  };
  challenges: {
    active: Challenge[];
    completedCount: number;
  };
  celebrations: {
    unseen: number;
    recent: Celebration[];
  };
}

export interface AchievementsQuery {
  category?: string;
  rarity?: AchievementRarity;
  unlocked?: boolean;
}

/* ---- Module 7 · Sprint 1: AI Mentor — Platform & Chat ---- */

export type ChatRole = 'system' | 'user' | 'assistant';
export type AiIntent =
  | 'general'
  | 'study-plan'
  | 'contest'
  | 'revision'
  | 'notebook'
  | 'pattern'
  | 'interview'
  | 'analytics'
  | 'unknown';
export type ProviderId = 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'mock';

export interface ModelInfo {
  id: string;
  label: string;
  contextWindow: number;
}

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  models: ModelInfo[];
  capabilities: { streaming: boolean; contextWindow: number };
  available: boolean;
  health: string;
}

export interface ProvidersResponse {
  providers: ProviderInfo[];
  defaultProvider: ProviderId;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIContextSection {
  key: string;
  title: string;
  summary: string;
  data?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  provider: string | null;
  model: string | null;
  usage: TokenUsage;
  responseTime: number;
  context: { intent: AiIntent; profiles: string[]; sections: { key: string; title: string }[] } | null;
  createdAt: string;
}

export type ContextProfileName =
  | 'learning'
  | 'knowledge'
  | 'revision'
  | 'contest'
  | 'analytics'
  | 'gamification'
  | 'conversation';

export interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: string | null;
  pinned: boolean;
  archived: boolean;
  lastIntent: string | null;
  lastProvider: string | null;
  lastModel: string | null;
  totalTokens: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetail extends Conversation {
  messages: ChatMessage[];
}

export interface ChatResult {
  conversationId: string;
  intent: AiIntent;
  profiles: ContextProfileName[];
  provider: ProviderId;
  fellBack: boolean;
  contextSections: AIContextSection[];
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

/* ---- Module 7 · Sprint 2: Mentor Workspace & Context Intelligence ---- */

export interface AIContext {
  intent: AiIntent;
  profiles: ContextProfileName[];
  sections: AIContextSection[];
  generatedAt: string;
  tokenEstimate: number;
}

export interface ContextPreviewSection {
  key: string;
  title: string;
  included: boolean;
  optional: boolean;
  tokenEstimate: number;
  preview: string;
}

export interface ContextPreview {
  intent: AiIntent;
  profiles: ContextProfileName[];
  sections: ContextPreviewSection[];
  includedTokens: number;
  overBudget: boolean;
}

export interface LearningSnapshot {
  currentPhase: string | null;
  currentTopic: string | null;
  mastery: number;
  revisionDue: number;
  weakestPattern: string | null;
  strongestPattern: string | null;
  currentStreak: number;
  contestReadiness: number | null;
  recommendation: { title: string; message: string; actionLabel: string; actionTo: string } | null;
}

export interface SuggestedPrompt {
  id: string;
  text: string;
  intent: AiIntent;
  command: string | null;
  reason: string;
}

export interface QuickAction {
  command: string;
  label: string;
  intent: AiIntent;
}

export interface AIWorkspaceData {
  snapshot: LearningSnapshot;
  suggestions: SuggestedPrompt[];
  recentConversations: Conversation[];
  recommendation: LearningSnapshot['recommendation'];
  quickActions: QuickAction[];
}

export interface ConversationExport {
  filename: string;
  format: 'markdown' | 'json';
  contentType: string;
  content: string;
}

export interface UpdateConversationInput {
  title?: string;
  pinned?: boolean;
  archived?: boolean;
}

export interface AISettings {
  preferredProvider: ProviderId;
  preferredModel: string;
  temperature: number;
  maxTokens: number;
  streamingEnabled: boolean;
  updatedAt: string | null;
}

export type UpdateAISettingsInput = Partial<Omit<AISettings, 'updatedAt'>>;

/** A streaming chat event (parsed from the SSE stream). */
export type ChatStreamEvent =
  | { type: 'start'; conversationId: string | null }
  | { type: 'token'; delta: string }
  | { type: 'done'; result: ChatResult }
  | { type: 'error'; code: string; message: string };

/* ---- Module 7 · Sprint 3: Specialized Coaching Framework ---- */

/** A deep-link action button attached to a coach response. */
export interface CoachAction {
  id: string;
  label: string;
  kind: string;
  /** In-app route to navigate to (empty when `intent` switches coach instead). */
  to: string;
  intent?: AiIntent;
  primary?: boolean;
}

/** A related topic/pattern reference (optionally deep-linkable). */
export interface CoachRelatedTopic {
  id: string | null;
  title: string;
  to: string | null;
}

/** Public metadata for a coach (from GET /ai/coaches). */
export interface CoachMeta {
  id: string;
  title: string;
  description: string;
  /** lucide-style icon name (mapped to a component on the client). */
  icon: string;
  intent: AiIntent;
  supportedIntents: AiIntent[];
  outputs: string[];
  usesProfiles: ContextProfileName[];
  promptVersion: string;
  followUps: string[];
}

/** GET /ai/coaches payload. */
export interface CoachesResponse {
  coaches: CoachMeta[];
  supportedIntents: AiIntent[];
}

/** The structured response returned by a coach turn (POST /ai/coach). */
export interface CoachResponse {
  coachId: string;
  intent: AiIntent;
  promptVersion: string;
  provider: ProviderId;
  model: string;
  fellBack: boolean;
  summary: string;
  explanation: string;
  recommendations: string[];
  suggestedActions: CoachAction[];
  relatedTopics: CoachRelatedTopic[];
  confidence: number;
  sourcesUsed: string[];
  followUpQuestions: string[];
  conversationId: string;
  contextSections: AIContextSection[];
  usage: TokenUsage;
  responseTime: number;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

/** A streaming coach event (parsed from the SSE stream). */
export type CoachStreamEvent =
  | { type: 'start'; conversationId: string | null; coachId: string; intent: AiIntent }
  | { type: 'token'; delta: string }
  | { type: 'done'; result: CoachResponse }
  | { type: 'error'; code: string; message: string };

/** Success envelope returned by every backend endpoint. */
export interface ApiEnvelope<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}
