import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { Phase } from '../models/Phase.js';
import { Topic } from '../models/Topic.js';
import { slugify } from '../utils/slugify.js';
import { logger } from '../utils/logger.js';
import { roadmapSeed } from './data.js';

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

    await Topic.insertMany(
      phaseSeed.topics.map((topic, index) => ({
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
      })),
    );

    totalTopics += phaseSeed.topics.length;
    logger.info(`  ✓ Phase ${phaseSeed.order}: ${phaseSeed.title} (${phaseSeed.topics.length} topics)`);
  }

  logger.info(`Seed complete — ${roadmapSeed.length} phases, ${totalTopics} topics.`);
  await disconnectDatabase();
}

seed()
  .then(() => process.exit(0))
  .catch(async (err) => {
    logger.error('Seed failed', err);
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  });
