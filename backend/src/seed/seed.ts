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
import { topicProgressRepository } from '../repositories/topicProgress.repository.js';
import { learningRepository } from '../repositories/learning.repository.js';
import { roadmapSeed } from './data.js';
import { buildTopicContent } from './content.js';
import { DEMO_PROGRESS, DEMO_CURRENT_TITLE } from './progress.js';

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

  logger.info(`Seed complete — ${roadmapSeed.length} phases, ${totalTopics} topics.`);
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

seed()
  .then(() => process.exit(0))
  .catch(async (err) => {
    logger.error('Seed failed', err);
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  });
