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
import { topicProgressRepository } from '../repositories/topicProgress.repository.js';
import { learningRepository } from '../repositories/learning.repository.js';
import { activityRepository } from '../repositories/activity.repository.js';
import { problemRepository } from '../repositories/problem.repository.js';
import { userProblemRepository } from '../repositories/userProblem.repository.js';
import { notebookRepository } from '../repositories/notebook.repository.js';
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
import type { ProblemStatus } from '../types/domain.js';

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

  logger.info(
    `Seed complete — ${roadmapSeed.length} phases, ${totalTopics} topics, ${problemCount} problems, ${notebookCount} notebook entries.`,
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

seed()
  .then(() => process.exit(0))
  .catch(async (err) => {
    logger.error('Seed failed', err);
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  });
