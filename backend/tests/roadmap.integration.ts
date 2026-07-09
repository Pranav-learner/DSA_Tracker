/**
 * Integration smoke test — spins up an in-memory MongoDB, seeds the roadmap and
 * exercises the full repository → service stack end-to-end.
 *
 *   npm run test:smoke
 *
 * Lives outside src/ so it is never bundled into the production build.
 */
import type { AddressInfo } from 'node:net';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { createApp } from '../src/app.js';
import { Phase } from '../src/models/Phase.js';
import { Topic } from '../src/models/Topic.js';
import { slugify } from '../src/utils/slugify.js';
import { roadmapSeed } from '../src/seed/data.js';
import { buildTopicContent } from '../src/seed/content.js';
import { roadmapService } from '../src/services/roadmap.service.js';
import { phaseService } from '../src/services/phase.service.js';
import { topicService } from '../src/services/topic.service.js';
import { masteryService } from '../src/services/mastery.service.js';
import { progressService } from '../src/services/progress.service.js';
import { unlockService } from '../src/services/unlock.service.js';
import { recommendationService } from '../src/services/recommendation.service.js';
import { learningStateService } from '../src/services/learningState.service.js';
import { topicProgressService } from '../src/services/topicProgress.service.js';
import { topicProgressRepository } from '../src/repositories/topicProgress.repository.js';
import { learningRepository } from '../src/repositories/learning.repository.js';
import { DEMO_PROGRESS, DEMO_CURRENT_TITLE } from '../src/seed/progress.js';

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
    const siblingTitles = p.topics.map((t) => t.title);
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
        ...buildTopicContent({
          title: t.title,
          description: t.description,
          difficulty: t.difficulty,
          prevTitle: i > 0 ? p.topics[i - 1].title : undefined,
          nextTitle: i < p.topics.length - 1 ? p.topics[i + 1].title : undefined,
          siblingTitles,
        }),
      })),
    );
  }

  // --- Sprint 3: seed demo learning progress (mirrors seed.ts) ---
  const DEMO_USER = 'demo-user';
  const allTopicsForSeed = await Topic.find().exec();
  const byTitle = new Map(allTopicsForSeed.map((t) => [t.title, t]));
  const seedNow = new Date();
  for (const entry of DEMO_PROGRESS) {
    const topic = byTitle.get(entry.title);
    if (!topic) continue;
    const m = entry.metrics;
    const overall = masteryService.computeOverall(m);
    const status = masteryService.deriveStatus(overall, m);
    await topicProgressRepository.upsert(DEMO_USER, String(topic._id), {
      ...masteryService.metricsToScores(m),
      overallMastery: overall,
      assessmentPassed: masteryService.assessmentPassed(m),
      currentStage: masteryService.currentStage(m),
      status,
      startedAt: seedNow,
      lastStudied: seedNow,
      completedAt: masteryService.isDone(status) ? seedNow : null,
    });
    if (entry.title === DEMO_CURRENT_TITLE) {
      await learningRepository.upsert(DEMO_USER, {
        currentPhaseId: topic.phaseId,
        currentTopicId: topic._id,
        currentStage: masteryService.currentStage(m),
        lastActiveAt: seedNow,
      });
    }
  }

  const roadmap = await roadmapService.get();
  console.log(`phases: ${roadmap.stats.totalPhases} | topics: ${roadmap.stats.totalTopics}`);
  console.log(`unlocked phases: ${roadmap.stats.unlockedPhases}`);

  const phase1 = roadmap.phases[1];
  const detail = await phaseService.getById(phase1.id);
  const topics = await topicService.listByPhase(phase1.id);
  console.log(`phase 1: ${detail.title} → ${topics.length} topics`);

  // --- Sprint 2: topic workspace detail (Sliding Window sits mid-phase) ---
  const swSummary = topics.find((t) => t.title === 'Sliding Window');
  assert(Boolean(swSummary), 'Sliding Window topic exists');
  const sw = await topicService.getById(swSummary!.id);
  console.log(
    `workspace: ${sw.title} | keywords=${sw.recognitionKeywords.length} | ` +
      `prev=${sw.navigation.previous?.title ?? '—'} next=${sw.navigation.next?.title ?? '—'} | ` +
      `phase=${sw.phase.title}`,
  );

  const related = await topicService.getRelated(sw.id);
  const problems = await topicService.getProblems(sw.id);
  console.log(
    `related: prereqs=[${related.prerequisites.map((t) => t.title).join(', ')}] ` +
      `related=[${related.related.map((t) => t.title).join(', ')}]`,
  );
  console.log(`problems: ${problems.map((p) => `${p.name} (${p.platform}/${p.difficulty})`).join(' | ')}`);

  // Every topic must have a complete, non-empty workspace.
  const allTopics = await topicService.list();
  let emptyContent = 0;
  for (const t of allTopics) {
    const d = await topicService.getById(t.id);
    if (!d.concept.coreIdea || d.recognitionKeywords.length === 0) emptyContent += 1;
  }

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
  // Sprint 2 assertions:
  assert(emptyContent === 0, 'every topic has coreIdea + recognition keywords');
  assert(sw.recognitionKeywords.includes('substring'), 'authored keywords present');
  assert(sw.navigation.previous?.title === 'Two Pointers', 'previous topic linked');
  assert(sw.navigation.next?.title === "Kadane's Algorithm", 'next topic linked');
  assert(sw.phase.title === 'Arrays & Linear Patterns', 'phase ref present');
  assert(related.prerequisites.some((t) => t.title === 'Two Pointers'), 'prerequisite resolved');
  assert(related.related.length >= 2, 'related topics resolved');
  assert(problems.length === 3 && problems.every((p) => p.status === 'Not Started'), 'read-only problems');

  // --- Sprint 3: Learning Engine (mastery, progress, unlock, recommendation) ---
  const kadane = topics.find((t) => t.title === "Kadane's Algorithm")!;

  const overview = await progressService.getOverview(DEMO_USER);
  const phase0 = overview.phases[0];
  const swOverlay = overview.topics.find((o) => o.topicId === sw.id)!;
  const kadaneOverlay = overview.topics.find((o) => o.topicId === kadane.id)!;
  console.log(
    `engine: overallMastery=${overview.overall.overallMastery}% completion=${overview.overall.completionPercent}% ` +
      `phase0=${phase0.status} currentTopic=${overview.currentTopicId === sw.id ? 'Sliding Window' : '?'} ` +
      `SW mastery=${swOverlay.mastery}% (${swOverlay.status}) Kadane unlocked=${kadaneOverlay.unlocked}`,
  );

  const rec = await recommendationService.get(DEMO_USER);
  const state = await learningStateService.get(DEMO_USER);
  console.log(`recommendation: [${rec.type}] ${rec.title} | learningState.current=${state.currentTopic?.title}`);

  // Unlock rule: Kadane is locked → explicit unlock must be rejected.
  let lockedThrew = false;
  try {
    await unlockService.unlockTopic(DEMO_USER, kadane.id);
  } catch {
    lockedThrew = true;
  }

  // Completing Sliding Window (pass assessment) should unlock Kadane.
  await topicProgressService.applyUpdate(DEMO_USER, sw.id, {
    standard: 90,
    variant: 88,
    mixed: 85,
    contest: 80,
    assessment: 85,
    confidence: 85,
  });
  const afterUnlock = await progressService.getOverview(DEMO_USER);
  const kadaneAfter = afterUnlock.topics.find((o) => o.topicId === kadane.id)!;
  const swAfter = afterUnlock.topics.find((o) => o.topicId === sw.id)!;
  console.log(`after study: SW=${swAfter.mastery}% (${swAfter.status}) → Kadane unlocked=${kadaneAfter.unlocked}`);

  // Mastery weights sanity: all-100 metrics → 100% overall.
  const perfect = masteryService.computeOverall({
    recognition: 100, implementation: 100, standard: 100, variant: 100,
    mixed: 100, contest: 100, assessment: 100, confidence: 100,
  });

  assert(overview.overall.topicsTotal === 59, 'overview covers all topics');
  assert(phase0.status === 'completed', 'Phase 0 is completed');
  assert(overview.phases[1].status === 'in-progress', 'Phase 1 is in progress');
  assert(overview.currentTopicId === sw.id, 'current topic is Sliding Window');
  assert(swOverlay.mastery >= 60 && swOverlay.mastery <= 72, 'Sliding Window mastery ≈ 67%');
  assert(swOverlay.status === 'In Progress', 'Sliding Window is In Progress (assessment pending)');
  assert(swOverlay.unlocked && !kadaneOverlay.unlocked, 'SW unlocked, Kadane locked');
  assert(perfect === 100, 'weights sum to 100%');
  assert(lockedThrew, 'unlocking a locked topic is rejected');
  assert(kadaneAfter.unlocked, 'completing SW unlocks Kadane');
  assert(swAfter.status === 'Completed' || swAfter.status === 'Mastered', 'SW now completed');
  assert(['continue-topic', 'complete-assessment'].includes(rec.type), 'recommendation is topic-focused');
  assert(state.currentTopic?.title === DEMO_CURRENT_TITLE, 'learning state points at current topic');

  // --- HTTP layer: exercise routes, controllers & validation over real HTTP ---
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${port}`;
  const getJson = async (path: string) => {
    const res = await fetch(base + path);
    return { status: res.status, body: (await res.json()) as { success: boolean; data?: unknown } };
  };
  const sendJson = async (method: string, path: string, body?: unknown) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, body: (await res.json()) as { success: boolean; data?: unknown } };
  };

  const bsoa = topics.find((t) => t.title === 'Binary Search on Answer')!;

  const httpDetail = await getJson(`/api/topics/${sw.id}`);
  const httpRelated = await getJson(`/api/topics/${sw.id}/related`);
  const httpProblems = await getJson(`/api/topics/${sw.id}/problems`);
  const httpBadId = await getJson('/api/topics/not-an-id');
  const httpMissing = await getJson('/api/topics/64b2f0000000000000000000/problems');
  // Sprint 3 endpoints
  const httpState = await getJson('/api/learning/state');
  const httpProgress = await getJson('/api/progress');
  const httpRec = await getJson('/api/recommendation');
  const httpUnlocked = await getJson('/api/topics/unlocked');
  const httpTopicProgress = await getJson(`/api/topics/${sw.id}/progress`);
  const httpMastery = await getJson(`/api/topics/${sw.id}/mastery`);
  const httpBadPatch = await sendJson('PATCH', `/api/topics/${sw.id}/progress`, { recognition: 150 });
  const httpLockedUnlock = await sendJson('POST', `/api/topics/${bsoa.id}/unlock`);
  server.close();

  console.log(
    `http core: detail=${httpDetail.status} related=${httpRelated.status} problems=${httpProblems.status} ` +
      `badId=${httpBadId.status} missing=${httpMissing.status}`,
  );
  console.log(
    `http engine: state=${httpState.status} progress=${httpProgress.status} rec=${httpRec.status} ` +
      `unlocked=${httpUnlocked.status} topicProgress=${httpTopicProgress.status} mastery=${httpMastery.status} ` +
      `badPatch=${httpBadPatch.status} lockedUnlock=${httpLockedUnlock.status}`,
  );

  assert(httpDetail.status === 200 && httpDetail.body.success, 'GET /topics/:id → 200');
  assert(httpRelated.status === 200 && httpRelated.body.success, 'GET /topics/:id/related → 200');
  assert(httpProblems.status === 200 && httpProblems.body.success, 'GET /topics/:id/problems → 200');
  assert(httpBadId.status === 400, 'invalid ObjectId → 400');
  assert(httpMissing.status === 404, 'unknown topic → 404');
  // Sprint 3 HTTP assertions:
  assert(httpState.status === 200 && httpState.body.success, 'GET /learning/state → 200');
  assert(httpProgress.status === 200 && httpProgress.body.success, 'GET /progress → 200');
  assert(httpRec.status === 200 && httpRec.body.success, 'GET /recommendation → 200');
  assert(httpUnlocked.status === 200 && httpUnlocked.body.success, 'GET /topics/unlocked → 200');
  assert(httpTopicProgress.status === 200, 'GET /topics/:id/progress → 200');
  assert(httpMastery.status === 200, 'GET /topics/:id/mastery → 200');
  assert(httpBadPatch.status === 400, 'invalid mastery value → 400');
  assert(httpLockedUnlock.status === 423, 'unlocking a locked topic → 423');

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
