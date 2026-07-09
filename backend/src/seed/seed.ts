import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { Phase } from '../models/Phase.js';
import { Topic } from '../models/Topic.js';
import { TopicProgress } from '../models/TopicProgress.js';
import { LearningState } from '../models/LearningState.js';
import { slugify } from '../utils/slugify.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { MASTERY_THRESHOLDS } from '../config/mastery.js';
import type { LadderStage } from '../types/domain.js';
import { masteryService } from '../services/mastery.service.js';
import { Types } from 'mongoose';
import { Problem } from '../models/Problem.js';
import { NotebookEntry } from '../models/NotebookEntry.js';
import { RevisionSchedule } from '../models/RevisionSchedule.js';
import { topicProgressRepository } from '../repositories/topicProgress.repository.js';
import { learningRepository } from '../repositories/learning.repository.js';
import { activityRepository } from '../repositories/activity.repository.js';
import { problemRepository } from '../repositories/problem.repository.js';
import { userProblemRepository } from '../repositories/userProblem.repository.js';
import { notebookRepository } from '../repositories/notebook.repository.js';
import { revisionScheduleRepository } from '../repositories/revisionSchedule.repository.js';
import { revisionSessionRepository } from '../repositories/revisionSession.repository.js';
import { retentionRepository } from '../repositories/retention.repository.js';
import { contestRepository } from '../contests/repositories/contest.repository.js';
import { contestProblemRepository } from '../contests/repositories/contestProblem.repository.js';
import { contestTimelineRepository } from '../contests/repositories/contestTimeline.repository.js';
import { ratingService } from '../contests/services/rating.service.js';
import { contestPerformanceService } from '../contests/services/contestPerformance.service.js';
import { getContestProvider } from '../contests/providers/contestProvider.js';
import type { ContestPlatform, ContestType } from '../types/domain.js';
import {
  DEFAULT_REVISION_INTERVALS,
  DEFAULT_EASE_FACTOR,
  DEFAULT_ENTITY_PRIORITY,
} from '../config/revision.js';
import { roadmapSeed } from './data.js';
import { buildTopicContent } from './content.js';
import { DEMO_PROGRESS, DEMO_CURRENT_TITLE } from './progress.js';
import { DEMO_ACTIVITY } from './activity.js';
import {
  buildProblemSeed,
  DEMO_SOLVED_TOPICS,
  DEMO_IN_PROGRESS_TOPICS,
  DEMO_FAVORITE_TITLES,
} from './problems.js';
import { DEMO_NOTEBOOK } from './notebook.js';
import type { ProblemStatus, RetentionLevel } from '../types/domain.js';

/**
 * Idempotent seed: wipes phases & topics, then repopulates the full roadmap.
 * Run with `npm run seed`.
 *
 *   - A phase's `estimatedProblems` is derived from the sum of its topics.
 *   - Topics inherit their phase's unlock state (real unlocking logic is a
 *     later sprint; the fields already exist so no migration is needed).
 */
async function seed(): Promise<void> {
  await connectDatabase();

  logger.info('Clearing existing phases & topics…');
  await Promise.all([Phase.deleteMany({}), Topic.deleteMany({})]);

  let totalTopics = 0;

  for (const phaseSeed of roadmapSeed) {
    const estimatedProblems = phaseSeed.topics.reduce((sum, t) => sum + t.estimatedProblems, 0);

    const phase = await Phase.create({
      title: phaseSeed.title,
      slug: slugify(phaseSeed.title),
      order: phaseSeed.order,
      description: phaseSeed.description,
      icon: phaseSeed.icon,
      estimatedWeeks: phaseSeed.estimatedWeeks,
      estimatedProblems,
      color: phaseSeed.color,
      isUnlocked: phaseSeed.isUnlocked,
      isCompleted: phaseSeed.isCompleted,
    });

    const siblingTitles = phaseSeed.topics.map((t) => t.title);

    await Topic.insertMany(
      phaseSeed.topics.map((topic, index) => {
        // Sprint 2: enrich each topic with study content (authored or derived).
        const content = buildTopicContent({
          title: topic.title,
          description: topic.description,
          difficulty: topic.difficulty,
          prevTitle: index > 0 ? phaseSeed.topics[index - 1].title : undefined,
          nextTitle:
            index < phaseSeed.topics.length - 1 ? phaseSeed.topics[index + 1].title : undefined,
          siblingTitles,
        });

        return {
          phaseId: phase._id,
          title: topic.title,
          slug: slugify(topic.title),
          description: topic.description,
          order: index,
          estimatedHours: topic.estimatedHours,
          estimatedProblems: topic.estimatedProblems,
          difficulty: topic.difficulty,
          // First topic of an unlocked phase opens the door; rest follow real
          // progress rules in a later sprint. For now: inherit the phase state.
          isUnlocked: phaseSeed.isUnlocked,
          isCompleted: false,
          ...content,
        };
      }),
    );

    totalTopics += phaseSeed.topics.length;
    logger.info(`  ✓ Phase ${phaseSeed.order}: ${phaseSeed.title} (${phaseSeed.topics.length} topics)`);
  }

  await seedDemoProgress();
  await seedDemoActivity();
  const problemCount = await seedProblems();
  await seedUserProblems();
  const notebookCount = await seedNotebook();
  const revisionCount = await seedRevision();
  const sessionCount = await seedRevisionSessions();
  const retentionCount = await seedRetention();
  const contestCount = await seedContests();

  logger.info(
    `Seed complete — ${roadmapSeed.length} phases, ${totalTopics} topics, ${problemCount} problems, ` +
      `${notebookCount} notebook entries, ${revisionCount} revision schedules, ${sessionCount} revision sessions, ` +
      `${retentionCount} retention profiles, ${contestCount} contests.`,
  );
  await disconnectDatabase();
}

/**
 * Sprint 3: seed the demo user's learning progress. Mastery/status/stage are
 * derived via the MasteryService (single source of truth) — never hard-coded.
 */
async function seedDemoProgress(): Promise<void> {
  const userId = env.demoUserId;
  logger.info(`Seeding demo learning progress for '${userId}'…`);

  await Promise.all([
    TopicProgress.deleteMany({ userId }),
    LearningState.deleteOne({ userId }),
  ]);

  const topics = await Topic.find().exec();
  const byTitle = new Map(topics.map((t) => [t.title, t]));
  const now = new Date();
  let currentTopicId: (typeof topics)[number]['_id'] | null = null;
  let currentPhaseId: (typeof topics)[number]['phaseId'] | null = null;
  let currentStage: LadderStage = 'recognition';

  for (const entry of DEMO_PROGRESS) {
    const topic = byTitle.get(entry.title);
    if (!topic) {
      logger.warn(`  ! demo progress references unknown topic: ${entry.title}`);
      continue;
    }
    const metrics = entry.metrics;
    const overall = masteryService.computeOverall(metrics);
    const threshold = topic.masteryThreshold ?? MASTERY_THRESHOLDS.completion;
    const status = masteryService.deriveStatus(overall, metrics, threshold);
    const stage = masteryService.currentStage(metrics);

    await topicProgressRepository.upsert(userId, String(topic._id), {
      ...masteryService.metricsToScores(metrics),
      overallMastery: overall,
      assessmentPassed: masteryService.assessmentPassed(metrics),
      currentStage: stage,
      status,
      startedAt: now,
      lastStudied: now,
      completedAt: masteryService.isDone(status) ? now : null,
    });

    if (entry.title === DEMO_CURRENT_TITLE) {
      currentTopicId = topic._id;
      currentPhaseId = topic.phaseId;
      currentStage = stage;
    }
  }

  await learningRepository.upsert(userId, {
    currentPhaseId,
    currentTopicId,
    currentStage,
    lastActiveAt: now,
  });

  logger.info(`  ✓ Demo progress seeded (${DEMO_PROGRESS.length} topics), current = ${DEMO_CURRENT_TITLE}.`);
}

/**
 * Sprint 4: seed the demo user's recent-activity feed for the dashboard timeline.
 * Each event's title is resolved to a real topic/phase id and back-dated so the
 * feed reads newest-first. Purely illustrative — the engine appends real events.
 */
async function seedDemoActivity(): Promise<void> {
  const userId = env.demoUserId;
  logger.info(`Seeding demo activity feed for '${userId}'…`);

  await activityRepository.deleteByUser(userId);

  const [topics, phases] = await Promise.all([Topic.find().exec(), Phase.find().exec()]);
  const topicByTitle = new Map(topics.map((t) => [t.title, t]));
  const phaseByTitle = new Map(phases.map((p) => [p.title, p]));
  const now = Date.now();

  const docs = DEMO_ACTIVITY.map((event) => {
    const entity =
      event.entityType === 'phase'
        ? phaseByTitle.get(event.entityTitle)
        : topicByTitle.get(event.entityTitle);
    if (!entity) {
      logger.warn(`  ! demo activity references unknown ${event.entityType}: ${event.entityTitle}`);
    }
    return {
      userId,
      type: event.type,
      entityType: event.entityType,
      entityId: entity ? String(entity._id) : null,
      title: event.title,
      description: event.description,
      createdAt: new Date(now - event.minutesAgo * 60_000),
    };
  });

  await activityRepository.insertMany(docs);
  logger.info(`  ✓ Demo activity seeded (${docs.length} events).`);
}

/**
 * Module 2 · Sprint 1: seed the Problem Library. Flattens every topic's curated
 * representative problems and adds curated extras (see seed/problems.ts).
 * Returns the number of problems seeded.
 */
async function seedProblems(): Promise<number> {
  logger.info('Seeding Problem Library…');
  await problemRepository.deleteAll();

  const topics = await Topic.find().exec();
  const docs = buildProblemSeed(topics);
  await problemRepository.insertMany(docs);

  const representative = docs.filter((d) => d.representative).length;
  logger.info(
    `  ✓ Seeded ${docs.length} problems (${representative} representative, ${docs.length - representative} extra).`,
  );
  return docs.length;
}

/**
 * Seed the demo user's per-problem states (status + favorite) so the library
 * shows realistic progress. Only non-default states are persisted.
 */
async function seedUserProblems(): Promise<void> {
  const userId = env.demoUserId;
  logger.info(`Seeding demo problem states for '${userId}'…`);
  await userProblemRepository.deleteByUser(userId);

  const [problems, topics] = await Promise.all([Problem.find().exec(), Topic.find().exec()]);
  const topicTitleById = new Map(topics.map((t) => [String(t._id), t.title]));
  const solved = new Set(DEMO_SOLVED_TOPICS);
  const inProgress = new Set(DEMO_IN_PROGRESS_TOPICS);
  const favorites = new Set(DEMO_FAVORITE_TITLES);
  const now = new Date();

  const docs = problems
    .map((p) => {
      const topicTitle = topicTitleById.get(String(p.topicId)) ?? '';
      const favorite = favorites.has(p.title);
      let status: ProblemStatus = 'Not Started';
      if (solved.has(topicTitle)) status = 'Solved';
      else if (inProgress.has(topicTitle)) status = 'In Progress';
      // Only persist meaningful (non-default) overlays.
      if (status === 'Not Started' && !favorite) return null;
      return {
        userId,
        problemId: p._id,
        status,
        favorite,
        lastViewed: status === 'Not Started' ? null : now,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  await userProblemRepository.insertMany(docs);
  const favCount = docs.filter((d) => d.favorite).length;
  logger.info(`  ✓ Seeded ${docs.length} user problem states (${favCount} favorites).`);
}

/**
 * Module 2 · Sprint 3: seed the demo Pattern Notebook. Two-pass so entries can
 * reference each other (the Prefix Sum → … → Segment Tree knowledge chain).
 */
async function seedNotebook(): Promise<number> {
  const userId = env.demoUserId;
  logger.info(`Seeding Pattern Notebook for '${userId}'…`);
  await notebookRepository.deleteByUser(userId);

  const problems = await Problem.find().exec();
  const byTitle = new Map(problems.map((p) => [p.title, p]));
  const now = Date.now();
  const DAY = 24 * 60 * 60_000;

  // Pass 1 — create entries (relatedEntries linked in pass 2).
  const entryIdByProblemTitle = new Map<string, string>();
  for (const n of DEMO_NOTEBOOK) {
    const problem = byTitle.get(n.problemTitle);
    if (!problem) {
      logger.warn(`  ! notebook references unknown problem: ${n.problemTitle}`);
      continue;
    }
    const relatedProblems = (n.relatedProblemTitles ?? [])
      .map((t) => byTitle.get(t)?._id)
      .filter((id): id is NonNullable<typeof id> => Boolean(id));
    const revisionDates = Array.from({ length: n.revisions ?? 0 }, (_, i) => new Date(now - (i + 1) * 5 * DAY));

    const doc = await notebookRepository.create({
      userId,
      problemId: problem._id,
      topicId: problem.topicId,
      phaseId: problem.phaseId,
      title: problem.title,
      pattern: problem.pattern,
      platform: problem.platform,
      recognitionKeywords: n.recognitionKeywords,
      observation: n.observation,
      coreAlgorithm: n.coreAlgorithm,
      timeComplexity: n.timeComplexity,
      spaceComplexity: n.spaceComplexity,
      alternativeSolutions: n.alternativeSolutions,
      commonMistakes: n.commonMistakes,
      lessonsLearned: n.lessonsLearned,
      personalNotes: n.personalNotes ?? '',
      confidence: n.confidence,
      relatedProblems,
      relatedEntries: [],
      revisionDates,
      lastReviewedAt: revisionDates[0] ?? null,
    });
    entryIdByProblemTitle.set(n.problemTitle, String(doc._id));
  }

  // Pass 2 — resolve related-entry titles → ids and link.
  for (const n of DEMO_NOTEBOOK) {
    const entryId = entryIdByProblemTitle.get(n.problemTitle);
    if (!entryId || !n.relatedEntryProblemTitles?.length) continue;
    const relatedEntries = n.relatedEntryProblemTitles
      .map((t) => entryIdByProblemTitle.get(t))
      .filter((id): id is string => Boolean(id))
      .map((id) => new Types.ObjectId(id));
    await notebookRepository.updateById(entryId, { relatedEntries });
  }

  logger.info(`  ✓ Notebook seeded (${entryIdByProblemTitle.size} entries).`);
  return entryIdByProblemTitle.size;
}

/**
 * Module 3 · Sprint 1: seed revision schedules from the demo user's notebook
 * entries + completed topics, with varied next-review dates so the daily queue,
 * calendar and dashboard widget look alive (some overdue, some due, some upcoming).
 */
async function seedRevision(): Promise<number> {
  const userId = env.demoUserId;
  logger.info(`Seeding revision schedules for '${userId}'…`);
  await revisionScheduleRepository.deleteByUser(userId);

  const [notebooks, progresses, topics] = await Promise.all([
    NotebookEntry.find({ userId }).exec(),
    topicProgressRepository.findByUser(userId),
    Topic.find().exec(),
  ]);
  const completed = progresses.filter((p) => p.status === 'Completed' || p.status === 'Mastered');
  const topicById = new Map(topics.map((t) => [String(t._id), t]));
  const now = Date.now();
  const DAY = 24 * 60 * 60_000;
  const offsets = [-6, -3, -1, 0, 0, 1, 2, 4, 7, 12]; // overdue → due → upcoming
  let i = 0;

  const build = (entityType: 'topic' | 'knowledgeEntry', entityId: string, title: string, priority: number) => {
    const offset = offsets[i % offsets.length];
    const interval = DEFAULT_REVISION_INTERVALS[Math.min(1 + (i % 4), DEFAULT_REVISION_INTERVALS.length - 1)];
    i += 1;
    return {
      userId,
      entityType,
      entityId,
      title,
      currentInterval: interval,
      nextReviewDate: new Date(now + offset * DAY),
      lastReviewDate: new Date(now - interval * DAY),
      reviewCount: i % 3,
      easeFactor: DEFAULT_EASE_FACTOR,
      priority,
      status: 'Pending' as const,
      strategy: 'default',
    };
  };

  const docs = [
    ...notebooks.map((nb) => build('knowledgeEntry', String(nb._id), nb.title, DEFAULT_ENTITY_PRIORITY.knowledgeEntry)),
    ...completed
      .map((p) => topicById.get(String(p.topicId)))
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
      .map((t) => build('topic', String(t._id), t.title, DEFAULT_ENTITY_PRIORITY.topic)),
  ];
  await revisionScheduleRepository.insertMany(docs);

  // A couple of revision activity events for the dashboard timeline (back-dated).
  const overdueCount = docs.filter((d) => d.nextReviewDate.getTime() < now).length;
  await activityRepository.insertMany([
    {
      userId,
      type: 'revision-scheduled',
      entityType: 'revision',
      entityId: 'seed',
      title: `${docs.length} revisions scheduled`,
      description: 'Your spaced-review plan is ready.',
      createdAt: new Date(now - 3 * 60_000),
    },
    ...(overdueCount > 0
      ? [
          {
            userId,
            type: 'revision-overdue' as const,
            entityType: 'revision' as const,
            entityId: 'seed',
            title: `${overdueCount} revisions overdue`,
            description: 'Catch up on overdue reviews to protect retention.',
            createdAt: new Date(now - 45 * 60_000),
          },
        ]
      : []),
  ]);

  logger.info(`  ✓ Revision seeded (${docs.length} schedules, ${overdueCount} overdue).`);
  return docs.length;
}

/**
 * Module 3 · Sprint 2: seed a few completed revision sessions so the history page
 * and dashboard session widget have realistic data on first run.
 */
async function seedRevisionSessions(): Promise<number> {
  const userId = env.demoUserId;
  logger.info(`Seeding revision sessions for '${userId}'…`);
  await revisionSessionRepository.deleteByUser(userId);

  const schedules = await RevisionSchedule.find({ userId }).limit(3).exec();
  const now = Date.now();
  const DAY = 24 * 60 * 60_000;

  const docs = schedules.map((s, i) => {
    const duration = 8 + i * 3;
    const startedAt = new Date(now - (i + 1) * DAY);
    return {
      userId,
      revisionScheduleId: s._id,
      entityType: s.entityType,
      entityId: s.entityId,
      title: s.title,
      sessionStatus: 'Completed' as const,
      startedAt,
      completedAt: new Date(startedAt.getTime() + duration * 60_000),
      durationMinutes: duration,
      reviewedKnowledgeEntries: [],
      reviewedProblems: [],
      reviewNotes: 'Refreshed the core idea and re-derived the key template.',
      selfConfidenceBefore: 60 + i * 5,
      selfConfidenceAfter: 72 + i * 5,
    };
  });
  await revisionSessionRepository.insertMany(docs);

  logger.info(`  ✓ Revision sessions seeded (${docs.length}).`);
  return docs.length;
}

/**
 * Module 3 · Sprint 3: seed retention profiles from the demo user's revision
 * schedules so the Retention Engine dashboard, rings and trend charts have a
 * spread of confidence/retention levels (Mastered → At Risk) on first run.
 */
async function seedRetention(): Promise<number> {
  const userId = env.demoUserId;
  logger.info(`Seeding retention profiles for '${userId}'…`);
  await retentionRepository.deleteByUser(userId);

  const [schedules, notebooks] = await Promise.all([
    RevisionSchedule.find({ userId }).exec(),
    NotebookEntry.find({ userId }).exec(),
  ]);
  const topicIdByEntry = new Map(notebooks.map((n) => [String(n._id), String(n.topicId)]));
  const now = Date.now();
  const DAY = 24 * 60 * 60_000;

  // A spread of confidence values so every retention level is represented.
  const confidences = [94, 88, 78, 66, 54, 45, 34];
  const reasons = ['Reviewed', 'Decay', 'Reviewed'];

  const docs = schedules.map((s, i) => {
    const confidence = confidences[i % confidences.length];
    const reviewCount = 1 + (i % 5);
    const successfulReviews = Math.max(1, reviewCount - (i % 2));
    const successRate = successfulReviews / reviewCount;
    const retention = Math.round(0.6 * confidence + 0.4 * successRate * 100);
    const overdue = s.nextReviewDate.getTime() < now;
    const level: RetentionLevel =
      retention < 40 || (overdue && (now - s.nextReviewDate.getTime()) / DAY > 7)
        ? 'At Risk'
        : overdue
          ? 'Needs Review'
          : retention >= 90
            ? 'Mastered'
            : retention >= 75
              ? 'Strong'
              : retention >= 50
                ? 'Familiar'
                : 'Learning';

    // A short back-dated history so trend sparklines render.
    const history = [0, 1, 2].map((h) => {
      const c = Math.max(0, Math.min(100, confidence - (2 - h) * 4));
      return {
        confidenceScore: c,
        retentionScore: Math.round(0.6 * c + 0.4 * successRate * 100),
        level,
        reason: reasons[h],
        date: new Date(now - (3 - h) * 4 * DAY),
      };
    });

    const topicId =
      s.entityType === 'topic'
        ? s.entityId
        : (topicIdByEntry.get(s.entityId) ?? null);

    return {
      userId,
      entityType: s.entityType,
      entityId: s.entityId,
      title: s.title,
      topicId: topicId ? new Types.ObjectId(topicId) : null,
      confidenceScore: confidence,
      retentionScore: retention,
      decayScore: Math.max(0.3, 2.0 / (1 + reviewCount * 0.35)),
      currentLevel: level,
      reviewCount,
      successfulReviews,
      missedReviews: i % 2,
      overdueReviews: overdue ? Math.max(1, Math.round((now - s.nextReviewDate.getTime()) / DAY)) : 0,
      averageReviewInterval: 3 + (i % 4),
      lastReviewDate: s.lastReviewDate,
      nextReviewDate: s.nextReviewDate,
      lastDecayDate: new Date(now - DAY),
      strategy: 'default',
      history,
    };
  });
  await retentionRepository.insertMany(docs);

  logger.info(`  ✓ Retention seeded (${docs.length} profiles).`);
  return docs.length;
}

/**
 * Module 5 · Sprint 1: seed a spread of contests (multi-platform) with a
 * realistic Codeforces rating progression, then rebuild the rating timeline.
 */
async function seedContests(): Promise<number> {
  const userId = env.demoUserId;
  logger.info(`Seeding contests for '${userId}'…`);
  await contestRepository.deleteByUser(userId);
  const now = Date.now();
  const DAY = 24 * 60 * 60_000;

  // A Codeforces rating arc (before → after) over recent weeks.
  const cfArc = [
    { id: '1900', name: 'Codeforces Round 1900 (Div. 2)', div: 'Div. 2', before: 1200, after: 1284, rank: 3120, days: 84 },
    { id: '1912', name: 'Educational Codeforces Round 160', div: 'Educational', before: 1284, after: 1341, rank: 2740, days: 70 },
    { id: '1925', name: 'Codeforces Round 1925 (Div. 2)', div: 'Div. 2', before: 1341, after: 1298, rank: 4010, days: 56 },
    { id: '1938', name: 'Codeforces Round 1938 (Div. 1)', div: 'Div. 1', before: 1298, after: 1372, rank: 1880, days: 42 },
    { id: '1950', name: 'Educational Codeforces Round 165', div: 'Educational', before: 1372, after: 1425, rank: 1540, days: 21 },
    { id: '1962', name: 'Codeforces Round 1962 (Div. 2)', div: 'Div. 2', before: 1425, after: 1489, rank: 980, days: 7 },
  ];

  const build = (
    platform: ContestPlatform,
    contestId: string,
    contestName: string,
    division: string,
    contestType: ContestType,
    daysAgo: number,
    durationMinutes: number,
    before: number | null,
    after: number | null,
    rank: number | null,
  ) => ({
    userId,
    platform,
    provider: platform,
    contestId,
    contestName,
    contestUrl: getContestProvider(platform).contestUrl(contestId),
    division,
    contestType,
    startTime: new Date(now - daysAgo * DAY),
    durationMinutes,
    ratingBefore: before,
    ratingAfter: after,
    ratingChange: before != null && after != null ? after - before : null,
    rank,
    percentile: rank ? Math.max(1, Math.min(99, Math.round(100 - rank / 80))) : null,
    participated: true,
    notes: '',
  });

  const docs = [
    ...cfArc.map((c) => build('Codeforces', c.id, c.name, c.div, 'Rated', c.days, 120, c.before, c.after, c.rank)),
    build('LeetCode', 'weekly-contest-390', 'LeetCode Weekly Contest 390', 'Weekly', 'Rated', 35, 90, 1720, 1768, 640),
    build('AtCoder', 'abc345', 'AtCoder Beginner Contest 345', 'ABC', 'Rated', 28, 100, 820, 861, 1420),
    build('Codeforces', 'gym-virtual-1', 'Virtual: Codeforces Round 1888', 'Div. 2', 'Virtual', 14, 120, null, null, 2200),
  ];

  await contestRepository.insertMany(docs);
  await ratingService.rebuild(userId);

  // Module 5 · Sprint 2 — build a full workspace for the most recent contest.
  const featured = await contestRepository.findByContestId(userId, 'Codeforces', '1962');
  if (featured) {
    const cRef = featured._id;
    const start = featured.startTime.getTime();
    const min = (m: number) => new Date(start + m * 60_000);
    // A → F with realistic outcomes (A,B,C solved; D attempted; E skipped; F untouched).
    const problems = [
      { index: 'A', code: '1962A', name: 'Equal Distribution', diff: '800', solved: true, attempts: 1, time: 6, penalty: 6, skipped: false },
      { index: 'B', code: '1962B', name: 'Increase/Decrease/Copy', diff: '1000', solved: true, attempts: 2, time: 19, penalty: 39, skipped: false },
      { index: 'C', code: '1962C', name: 'Paint the Array', diff: '1300', solved: true, attempts: 3, time: 41, penalty: 81, skipped: false },
      { index: 'D', code: '1962D', name: 'Range Update Point Query', diff: '1700', solved: false, attempts: 2, time: 28, penalty: 0, skipped: false },
      { index: 'E', code: '1962E', name: 'Tree Sum', diff: '2100', solved: false, attempts: 0, time: 0, penalty: 0, skipped: true },
      { index: 'F', code: '1962F', name: 'Sarah & Grid', diff: '2500', solved: false, attempts: 0, time: 0, penalty: 0, skipped: false },
    ];
    await contestProblemRepository.insertMany(
      problems.map((p) => ({
        contestRef: cRef,
        userId,
        problemCode: p.code,
        problemName: p.name,
        platformProblemId: p.code,
        url: `https://codeforces.com/contest/1962/problem/${p.index}`,
        index: p.index,
        difficulty: p.diff,
        tags: [],
        solved: p.solved,
        skipped: p.skipped,
        attempted: p.attempts > 0 || p.solved,
        attempts: p.attempts,
        firstAttemptAt: p.attempts > 0 || p.solved ? min(p.time > 6 ? p.time - 6 : 1) : null,
        solvedAt: p.solved ? min(p.time) : null,
        totalTimeSpent: p.time,
        penalty: p.penalty,
      })),
    );

    // A readable timeline.
    await contestTimelineRepository.insertMany([
      { contestRef: cRef, userId, timestamp: min(0), eventType: 'contest-started', problemCode: '', description: 'Contest started' },
      { contestRef: cRef, userId, timestamp: min(1), eventType: 'problem-opened', problemCode: '1962A', description: 'Opened A' },
      { contestRef: cRef, userId, timestamp: min(6), eventType: 'accepted', problemCode: '1962A', description: 'Accepted A' },
      { contestRef: cRef, userId, timestamp: min(8), eventType: 'problem-opened', problemCode: '1962B', description: 'Opened B' },
      { contestRef: cRef, userId, timestamp: min(15), eventType: 'wrong-answer', problemCode: '1962B', description: 'Wrong answer on B' },
      { contestRef: cRef, userId, timestamp: min(19), eventType: 'accepted', problemCode: '1962B', description: 'Accepted B' },
      { contestRef: cRef, userId, timestamp: min(22), eventType: 'problem-opened', problemCode: '1962C', description: 'Opened C' },
      { contestRef: cRef, userId, timestamp: min(41), eventType: 'accepted', problemCode: '1962C', description: 'Accepted C' },
      { contestRef: cRef, userId, timestamp: min(92), eventType: 'tle', problemCode: '1962D', description: 'TLE on D' },
      { contestRef: cRef, userId, timestamp: min(120), eventType: 'contest-finished', problemCode: '', description: 'Contest finished' },
    ]);

    await contestPerformanceService.recalculate(userId, String(cRef));
  }

  // A back-dated activity for the timeline.
  await activityRepository.insertMany([
    {
      userId,
      type: 'contest-added',
      entityType: 'contest',
      entityId: 'seed',
      title: `${docs.length} contests logged`,
      description: 'Your contest library is ready.',
      createdAt: new Date(now - 4 * 60_000),
    },
  ]);

  logger.info(`  ✓ Contests seeded (${docs.length}, +workspace for CF 1962).`);
  return docs.length;
}

seed()
  .then(() => process.exit(0))
  .catch(async (err) => {
    logger.error('Seed failed', err);
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  });
