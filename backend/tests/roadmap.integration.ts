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
import { dashboardService } from '../src/services/dashboard.service.js';
import { activityService } from '../src/services/activity.service.js';
import { Problem } from '../src/models/Problem.js';
import { problemService } from '../src/services/problem.service.js';
import { attemptService } from '../src/services/attempt.service.js';
import { problemRepository } from '../src/repositories/problem.repository.js';
import { userProblemRepository } from '../src/repositories/userProblem.repository.js';
import {
  buildProblemSeed,
  DEMO_SOLVED_TOPICS,
  DEMO_IN_PROGRESS_TOPICS,
  DEMO_FAVORITE_TITLES,
} from '../src/seed/problems.js';
import type { ProblemStatus } from '../src/types/domain.js';
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

  // --- Sprint 4: Dashboard aggregation + Activity ---
  // Completing Sliding Window above should have recorded an activity event.
  const activity = await activityService.getRecent(DEMO_USER, 10);
  const dashboard = await dashboardService.get(DEMO_USER);
  console.log(
    `dashboard: currentTopic=${dashboard.currentTopic?.title ?? '—'} ` +
      `currentPhase=${dashboard.currentPhase?.title ?? '—'} phases=${dashboard.roadmap.length} ` +
      `rec=[${dashboard.recommendation.type}] recTopic=${dashboard.recommendedTopic?.title ?? '—'} ` +
      `activity=${activity.length} phaseRemaining=${dashboard.currentPhaseProgress?.estimatedTimeRemainingHours ?? '—'}h`,
  );
  const completedState = dashboard.roadmap.find((p) => p.state === 'completed');
  const currentState = dashboard.roadmap.find((p) => p.state === 'current');

  assert(dashboard.roadmap.length === 11, 'dashboard roadmap covers all 11 phases');
  assert(dashboard.overall.topicsTotal === 59, 'dashboard overall aggregates all topics');
  assert(Boolean(completedState), 'roadmap has a completed phase (Phase 0)');
  assert(Boolean(currentState), 'roadmap marks the current phase');
  assert(dashboard.currentPhaseProgress !== null, 'dashboard resolves current phase progress');
  assert(
    dashboard.currentPhaseProgress!.estimatedTimeRemainingHours >= 0,
    'estimated time remaining is non-negative',
  );
  assert(dashboard.recentActivity.length >= 1, 'activity feed is populated after study');
  assert(
    activity.some((a) => a.type === 'topic-completed' || a.type === 'topic-mastered'),
    'completing a topic recorded a completion activity',
  );
  assert(
    activity.every((a, i) => i === 0 || activity[i - 1].createdAt >= a.createdAt),
    'activity feed is newest-first',
  );

  // --- Module 2 · Sprint 1: Problem Library ---
  await problemRepository.deleteAll();
  const topicsForProblems = await Topic.find().exec();
  await problemRepository.insertMany(buildProblemSeed(topicsForProblems));

  // Seed demo user problem states (mirrors seed.ts).
  const topicTitleById = new Map(topicsForProblems.map((t) => [String(t._id), t.title]));
  const solvedSet = new Set(DEMO_SOLVED_TOPICS);
  const inProgressSet = new Set(DEMO_IN_PROGRESS_TOPICS);
  const favSet = new Set(DEMO_FAVORITE_TITLES);
  const seededProblems = await Problem.find().exec();
  const upDocs = seededProblems
    .map((p) => {
      const tt = topicTitleById.get(String(p.topicId)) ?? '';
      const favorite = favSet.has(p.title);
      let st: ProblemStatus = 'Not Started';
      if (solvedSet.has(tt)) st = 'Solved';
      else if (inProgressSet.has(tt)) st = 'In Progress';
      if (st === 'Not Started' && !favorite) return null;
      return { userId: DEMO_USER, problemId: p._id, status: st, favorite, lastViewed: st === 'Not Started' ? null : seedNow };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);
  await userProblemRepository.insertMany(upDocs);

  const facets = await problemService.facets();
  const allProblems = await problemService.list(DEMO_USER, { page: 1, pageSize: 20, sort: 'difficulty', order: 'asc' });
  const swTopicProblems = await problemService.list(DEMO_USER, { page: 1, pageSize: 100, sort: 'difficulty', order: 'asc', topic: sw.id });
  const solvedList = await problemService.list(DEMO_USER, { page: 1, pageSize: 100, sort: 'title', order: 'asc', status: 'Solved' });
  const favList = await problemService.list(DEMO_USER, { page: 1, pageSize: 100, sort: 'title', order: 'asc', favorite: true });
  const searchList = await problemService.list(DEMO_USER, { page: 1, pageSize: 50, sort: 'title', order: 'asc', q: 'subarray' });
  const extrasList = await problemService.list(DEMO_USER, { page: 1, pageSize: 100, sort: 'title', order: 'asc', representative: false });
  const titleSorted = await problemService.list(DEMO_USER, { page: 1, pageSize: 10, sort: 'title', order: 'asc' });
  const problemDetail = await problemService.getById(DEMO_USER, allProblems.items[0].id);

  console.log(
    `problems: total=${allProblems.total} pages=${allProblems.totalPages} patterns=${facets.patterns.length} ` +
      `platforms=${facets.platforms.length}`,
  );
  console.log(
    `  filters: topic(SW)=${swTopicProblems.total} solved=${solvedList.total} fav=${favList.total} ` +
      `search('subarray')=${searchList.total} extras=${extrasList.total}`,
  );
  console.log(`  detail: "${problemDetail.title}" topic=${problemDetail.topic?.title} phase=${problemDetail.phase?.title} status=${problemDetail.status}`);

  const titles = titleSorted.items.map((p) => p.title);

  assert(allProblems.total >= 150 && allProblems.total <= 220, 'library holds 150–200ish problems');
  assert(allProblems.items.length === 20 && allProblems.totalPages > 1 && allProblems.hasNext, 'pagination works');
  assert(facets.patterns.length > 5 && facets.platforms.length >= 3, 'facets expose patterns + platforms');
  assert(swTopicProblems.total >= 3 && swTopicProblems.items.every((p) => p.topicId === sw.id), 'topic filter works');
  assert(solvedList.total >= 1 && solvedList.items.every((p) => p.status === 'Solved'), 'status filter works');
  assert(favList.total >= 1 && favList.items.every((p) => p.favorite), 'favorite filter works');
  assert(
    searchList.total >= 1 &&
      searchList.items.every(
        (p) => /subarray/i.test(p.title) || /subarray/i.test(p.pattern) || p.tags.some((t) => /subarray/i.test(t)),
      ),
    'search matches title/pattern/tags',
  );
  assert(extrasList.total >= 10 && extrasList.items.every((p) => p.representative === false), 'representative filter works');
  assert(titles.every((t, i) => i === 0 || titles[i - 1].localeCompare(t) <= 0), 'title sort is ascending');
  assert(Boolean(problemDetail.topic) && Boolean(problemDetail.phase), 'detail resolves topic + phase refs');
  assert(extrasList.items.some((p) => p.pattern === 'Greedy'), 'Greedy pattern is covered');

  // --- Module 2 · Sprint 2: Attempt Tracking Engine ---
  const targetProblem = await Problem.findOne({ title: 'Binary Search' }).exec();
  assert(Boolean(targetProblem), 'seeded a target problem for attempts');
  const targetProblemId = String(targetProblem!._id);
  const t0 = seedNow.getTime();
  const mins = (m: number) => new Date(t0 - m * 60_000);

  // The learning journey: WA → TLE → Solved (history is preserved forever).
  const at1 = await attemptService.create(DEMO_USER, {
    problemId: targetProblemId, status: 'Abandoned', verdict: 'Wrong Answer', language: 'C++',
    startTime: mins(40), endTime: mins(22), wrongAttempts: 2,
  });
  const at2 = await attemptService.create(DEMO_USER, {
    problemId: targetProblemId, status: 'Abandoned', verdict: 'TLE', language: 'C++',
    startTime: mins(20), endTime: mins(8), usedHint: true,
  });
  const at3 = await attemptService.create(DEMO_USER, {
    problemId: targetProblemId, status: 'Solved', verdict: 'Accepted', language: 'C++',
    startTime: mins(10), endTime: mins(1), durationMinutes: 9,
  });

  const upSynced = await userProblemRepository.findByUserAndProblem(DEMO_USER, targetProblemId);
  const history = await attemptService.history(DEMO_USER, targetProblemId);
  const summary = await attemptService.summary(DEMO_USER, targetProblemId);

  console.log(
    `attempts: #${at1.attemptNumber}(${at1.verdict},${at1.durationMinutes}m) → ` +
      `#${at2.attemptNumber}(${at2.verdict},${at2.durationMinutes}m) → ` +
      `#${at3.attemptNumber}(${at3.status},${at3.durationMinutes}m)`,
  );
  console.log(
    `  userProblem: solved=${upSynced?.solved} status=${upSynced?.status} total=${upSynced?.totalAttempts} ` +
      `time=${upSynced?.totalTimeSpent}m noHint=${upSynced?.solvedWithoutHint} fav(kept)=${upSynced?.favorite}`,
  );
  console.log(
    `  summary: total=${summary.totalAttempts} solved=${summary.solved} avg=${summary.averageSolveTime}m ` +
      `hints=${summary.hintUsageCount} latest=#${summary.latestAttempt?.attemptNumber}`,
  );

  assert(at1.attemptNumber === 1 && at2.attemptNumber === 2 && at3.attemptNumber === 3, 'attempt numbers increment');
  assert(at1.durationMinutes === 18 && at2.durationMinutes === 12 && at3.durationMinutes === 9, 'duration derived + explicit');
  assert(upSynced !== null && upSynced.solved && upSynced.status === 'Solved', 'UserProblem synced to Solved');
  assert(upSynced!.totalAttempts === 3 && upSynced!.totalTimeSpent === 39, 'UserProblem aggregates synced');
  assert(upSynced!.firstSolvedAt !== null && upSynced!.solvedWithoutHint === true, 'first-solve + no-hint flags');
  assert(upSynced!.favorite === true, 'favorite preserved through attempt sync');
  assert(history.length === 3 && history[0].attemptNumber === 3, 'history is newest-first');
  assert(summary.totalAttempts === 3 && summary.solved && summary.averageSolveTime === 9, 'summary aggregates');
  assert(summary.totalTimeSpent === 39 && summary.hintUsageCount === 1 && summary.editorialUsageCount === 0, 'summary usage totals');
  assert(summary.latestAttempt?.attemptNumber === 3, 'summary carries the latest attempt');

  // Update an attempt (notes / verdict) — history stays intact.
  const updated = await attemptService.update(DEMO_USER, at1.id, { notes: 'off-by-one on the window' });
  assert(updated.notes.includes('off-by-one'), 'attempt update applies');

  // Soft delete #2 → aggregates recompute, history shrinks, record preserved.
  await attemptService.remove(DEMO_USER, at2.id);
  const historyAfter = await attemptService.history(DEMO_USER, targetProblemId);
  const upAfter = await userProblemRepository.findByUserAndProblem(DEMO_USER, targetProblemId);
  assert(historyAfter.length === 2, 'soft delete removes from history');
  assert(upAfter!.totalAttempts === 2 && upAfter!.totalTimeSpent === 27 && upAfter!.solved === true, 'aggregates recomputed after delete');

  let deletedThrew = false;
  try {
    await attemptService.getById(DEMO_USER, at2.id);
  } catch {
    deletedThrew = true;
  }
  assert(deletedThrew, 'soft-deleted attempt is not retrievable');

  let badTimeThrew = false;
  try {
    await attemptService.create(DEMO_USER, {
      problemId: targetProblemId, status: 'Started', verdict: 'Unknown', language: 'C++',
      startTime: mins(1), endTime: mins(10),
    });
  } catch {
    badTimeThrew = true;
  }
  assert(badTimeThrew, 'startTime must be before endTime');

  const attemptActivity = await activityService.getRecent(DEMO_USER, 30);
  assert(
    attemptActivity.some((a) => a.type === 'problem-solved') &&
      attemptActivity.some((a) => a.type === 'attempt-started'),
    'attempt activity events are generated',
  );

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
  const httpDashboard = await getJson('/api/dashboard');
  const httpLibList = await getJson('/api/problems?pageSize=5&sort=difficulty');
  const httpProblemsSearch = await getJson('/api/problems/search?q=binary');
  const httpFacets = await getJson('/api/problems/facets');
  const httpProblemDetail = await getJson(`/api/problems/${allProblems.items[0].id}`);
  const httpProblemBadId = await getJson('/api/problems/not-an-id');
  const httpProblemMissing = await getJson('/api/problems/64b2f0000000000000000000');
  const httpProblemsBadPage = await getJson('/api/problems?page=abc'); // coerced → 1, still 200

  // Module 2 · Sprint 2 — attempt endpoints over HTTP.
  const httpAttemptCreate = await sendJson('POST', '/api/attempts', {
    problemId: targetProblemId, status: 'Started', verdict: 'Unknown', language: 'Python',
    startTime: mins(5).toISOString(),
  });
  const createdAttemptId = (httpAttemptCreate.body.data as { id?: string } | undefined)?.id ?? '';
  const httpAttemptHistory = await getJson(`/api/problems/${targetProblemId}/attempts`);
  const httpAttemptSummary = await getJson(`/api/problems/${targetProblemId}/summary`);
  const httpAttemptGet = await getJson(`/api/attempts/${createdAttemptId}`);
  const httpAttemptPatch = await sendJson('PATCH', `/api/attempts/${createdAttemptId}`, {
    status: 'Solved', verdict: 'Accepted', endTime: mins(0).toISOString(),
  });
  const httpAttemptDelete = await sendJson('DELETE', `/api/attempts/${createdAttemptId}`);
  const httpAttemptBadTime = await sendJson('POST', '/api/attempts', {
    problemId: targetProblemId, status: 'Started', verdict: 'Unknown', language: 'Python',
    startTime: mins(0).toISOString(), endTime: mins(10).toISOString(),
  });
  const httpAttemptMissingProblem = await sendJson('POST', '/api/attempts', {
    problemId: '64b2f0000000000000000000', status: 'Started', verdict: 'Unknown', language: 'Python',
    startTime: mins(5).toISOString(),
  });
  server.close();

  console.log(
    `http core: detail=${httpDetail.status} related=${httpRelated.status} problems=${httpProblems.status} ` +
      `badId=${httpBadId.status} missing=${httpMissing.status}`,
  );
  console.log(
    `http engine: state=${httpState.status} progress=${httpProgress.status} rec=${httpRec.status} ` +
      `unlocked=${httpUnlocked.status} topicProgress=${httpTopicProgress.status} mastery=${httpMastery.status} ` +
      `badPatch=${httpBadPatch.status} lockedUnlock=${httpLockedUnlock.status} dashboard=${httpDashboard.status}`,
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
  assert(httpDashboard.status === 200 && httpDashboard.body.success, 'GET /dashboard → 200');
  // Module 2 · Sprint 1 HTTP assertions:
  console.log(
    `http problems: list=${httpLibList.status} search=${httpProblemsSearch.status} facets=${httpFacets.status} ` +
      `detail=${httpProblemDetail.status} badId=${httpProblemBadId.status} missing=${httpProblemMissing.status} ` +
      `badPage=${httpProblemsBadPage.status}`,
  );
  assert(httpLibList.status === 200 && httpLibList.body.success, 'GET /problems → 200');
  assert(httpProblemsSearch.status === 200 && httpProblemsSearch.body.success, 'GET /problems/search → 200');
  assert(httpFacets.status === 200 && httpFacets.body.success, 'GET /problems/facets → 200');
  assert(httpProblemDetail.status === 200 && httpProblemDetail.body.success, 'GET /problems/:id → 200');
  assert(httpProblemBadId.status === 400, 'GET /problems/:id invalid → 400');
  assert(httpProblemMissing.status === 404, 'GET /problems/:id missing → 404');
  assert(httpProblemsBadPage.status === 200, 'GET /problems bad page is coerced → 200');
  // Module 2 · Sprint 2 HTTP assertions:
  console.log(
    `http attempts: create=${httpAttemptCreate.status} history=${httpAttemptHistory.status} ` +
      `summary=${httpAttemptSummary.status} get=${httpAttemptGet.status} patch=${httpAttemptPatch.status} ` +
      `delete=${httpAttemptDelete.status} badTime=${httpAttemptBadTime.status} missingProblem=${httpAttemptMissingProblem.status}`,
  );
  assert(httpAttemptCreate.status === 201 && httpAttemptCreate.body.success, 'POST /attempts → 201');
  assert(httpAttemptHistory.status === 200, 'GET /problems/:id/attempts → 200');
  assert(httpAttemptSummary.status === 200, 'GET /problems/:id/summary → 200');
  assert(httpAttemptGet.status === 200, 'GET /attempts/:id → 200');
  assert(httpAttemptPatch.status === 200, 'PATCH /attempts/:id → 200');
  assert(httpAttemptDelete.status === 200, 'DELETE /attempts/:id → 200');
  assert(httpAttemptBadTime.status === 400, 'POST /attempts invalid times → 400');
  assert(httpAttemptMissingProblem.status === 404, 'POST /attempts missing problem → 404');

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
