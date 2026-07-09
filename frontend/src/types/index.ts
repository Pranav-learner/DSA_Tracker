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
  | 'knowledge-at-risk';

export type ActivityEntityType = 'topic' | 'phase' | 'problem' | 'revision';

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

/** Success envelope returned by every backend endpoint. */
export interface ApiEnvelope<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}
