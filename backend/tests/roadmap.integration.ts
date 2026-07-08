/**
 * Integration smoke test — spins up an in-memory MongoDB, seeds the roadmap and
 * exercises the full repository → service stack end-to-end.
 *
 *   npm run test:smoke
 *
 * Lives outside src/ so it is never bundled into the production build.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { Phase } from '../src/models/Phase.js';
import { Topic } from '../src/models/Topic.js';
import { slugify } from '../src/utils/slugify.js';
import { roadmapSeed } from '../src/seed/data.js';
import { roadmapService } from '../src/services/roadmap.service.js';
import { phaseService } from '../src/services/phase.service.js';
import { topicService } from '../src/services/topic.service.js';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error('ASSERT FAILED: ' + msg);
}

async function run(): Promise<void> {
  const mongo = await MongoMemoryServer.create();
  await connectDatabase(mongo.getUri());

  // Seed inline (mirrors src/seed/seed.ts).
  for (const p of roadmapSeed) {
    const estimatedProblems = p.topics.reduce((s, t) => s + t.estimatedProblems, 0);
    const phase = await Phase.create({
      title: p.title,
      slug: slugify(p.title),
      order: p.order,
      description: p.description,
      icon: p.icon,
      estimatedWeeks: p.estimatedWeeks,
      estimatedProblems,
      color: p.color,
      isUnlocked: p.isUnlocked,
      isCompleted: p.isCompleted,
    });
    await Topic.insertMany(
      p.topics.map((t, i) => ({
        phaseId: phase._id,
        title: t.title,
        slug: slugify(t.title),
        description: t.description,
        order: i,
        estimatedHours: t.estimatedHours,
        estimatedProblems: t.estimatedProblems,
        difficulty: t.difficulty,
        isUnlocked: p.isUnlocked,
        isCompleted: false,
      })),
    );
  }

  const roadmap = await roadmapService.get();
  console.log(`phases: ${roadmap.stats.totalPhases} | topics: ${roadmap.stats.totalTopics}`);
  console.log(`unlocked phases: ${roadmap.stats.unlockedPhases}`);

  const phase1 = roadmap.phases[1];
  const detail = await phaseService.getById(phase1.id);
  const topics = await topicService.listByPhase(phase1.id);
  const single = await topicService.getById(topics[0].id);
  console.log(`phase 1: ${detail.title} → ${topics.length} topics, first = ${single.title}`);

  // Error path: unknown id resolves to a 404-style service error.
  let missingThrew = false;
  try {
    await topicService.getById('64b2f0000000000000000000');
  } catch {
    missingThrew = true;
  }

  assert(roadmap.stats.totalPhases === 11, 'exactly 11 phases');
  assert(roadmap.phases.every((p) => p.topicCount > 0), 'every phase has topics');
  assert(roadmap.phases.every((p, i) => p.order === i), 'phases are ordered 0..10');
  assert(detail.progress.percent === 0, 'progress placeholder is 0');
  assert(missingThrew, 'unknown topic id throws');
  console.log('\n✅ ALL ASSERTIONS PASSED');

  await disconnectDatabase();
  await mongo.stop();
}

run().then(
  () => process.exit(0),
  (e) => {
    console.error('SMOKE FAILED:', e);
    process.exit(1);
  },
);
