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
import { notebookService } from '../src/services/notebook.service.js';
import { workspaceService } from '../src/services/workspace.service.js';
import { learningIntegrationService } from '../src/services/learningIntegration.service.js';
import { revisionScheduleService } from '../src/services/revisionSchedule.service.js';
import { revisionQueueService } from '../src/services/revisionQueue.service.js';
import { revisionSessionService } from '../src/services/revisionSession.service.js';
import { revisionWorkspaceService } from '../src/services/revisionWorkspace.service.js';
import { retentionService } from '../src/services/retention.service.js';
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

  // --- Module 2 · Sprint 3: Pattern Notebook (Knowledge Engine) ---
  const nbProblem = await Problem.findOne({ title: 'Two Sum' }).exec();
  const relProblem = await Problem.findOne({ title: '3Sum' }).exec();
  const nb2Problem = await Problem.findOne({ title: 'Range Sum Query - Immutable' }).exec();
  const nbHttpProblem = await Problem.findOne({ title: 'Container With Most Water' }).exec();
  const nbBadConfProblem = await Problem.findOne({ title: 'Maximum Subarray' }).exec();
  assert(Boolean(nbProblem && relProblem && nb2Problem && nbHttpProblem && nbBadConfProblem), 'notebook target problems exist');
  const nbHttpProblemId = String(nbHttpProblem!._id);
  const nbBadConfProblemId = String(nbBadConfProblem!._id);

  const nb1 = await notebookService.create(DEMO_USER, {
    problemId: String(nbProblem!._id), confidence: 80, observation: 'hash the complement',
    coreAlgorithm: 'one pass, map value→index', timeComplexity: 'O(n)', spaceComplexity: 'O(n)',
    recognitionKeywords: ['pair', 'target', 'complement'], commonMistakes: ['store before check'],
    relatedProblems: [String(relProblem!._id)],
  });
  const nb2 = await notebookService.create(DEMO_USER, {
    problemId: String(nb2Problem!._id), confidence: 60, pattern: 'Prefix Sum',
    observation: 'precompute cumulative sums for O(1) range queries',
  });

  console.log(
    `notebook: created "${nb1.title}" (${nb1.pattern}, conf ${nb1.confidence}) relProblems=${nb1.relatedProblems.length} ` +
      `relTopic="${nb1.relatedProblems[0]?.topicTitle}"`,
  );

  let dupThrew = false;
  try {
    await notebookService.create(DEMO_USER, { problemId: String(nbProblem!._id) });
  } catch {
    dupThrew = true;
  }

  const nbUpdated = await notebookService.update(DEMO_USER, nb1.id, {
    confidence: 88, lessonsLearned: 'hashing beats sorting when indices matter',
    relatedEntries: [nb2.id], review: true,
  });
  const nbDetail = await notebookService.getById(DEMO_USER, nb1.id);

  const allNb = await notebookService.list(DEMO_USER, { page: 1, pageSize: 10, sort: 'recent', order: 'desc' });
  const byPattern = await notebookService.list(DEMO_USER, { page: 1, pageSize: 10, sort: 'confidence', order: 'desc', pattern: nb1.pattern });
  const highConf = await notebookService.list(DEMO_USER, { page: 1, pageSize: 10, sort: 'confidence', order: 'desc', confidenceMin: 80 });
  const searchNb = await notebookService.list(DEMO_USER, { page: 1, pageSize: 10, sort: 'recent', order: 'desc', q: 'complement' });
  const nbFacets = await notebookService.facets(DEMO_USER);

  console.log(
    `  update: conf=${nbUpdated.confidence} revisions=${nbUpdated.revisionCount} relEntries=${nbUpdated.relatedEntries.length} | ` +
      `list total=${allNb.total} pattern=${byPattern.total} highConf=${highConf.total} search('complement')=${searchNb.total} ` +
      `patterns=${nbFacets.patterns.length}`,
  );

  assert(nb1.confidence === 80 && nb1.relatedProblems.length === 1, 'create resolves problem + related problems');
  assert(nb1.relatedProblems[0].topicTitle.length > 0, 'related problem resolves its topic title');
  assert(nb1.pattern === 'Hashing / Scan' || nb1.pattern.length > 0, 'pattern pre-filled from problem');
  assert(dupThrew, 'duplicate notebook entry rejected');
  assert(nbUpdated.confidence === 88 && nbUpdated.revisionCount === 1 && nbUpdated.lastReviewedAt !== null, 'update content + review');
  assert(nbUpdated.relatedEntries.length === 1 && nbUpdated.relatedEntries[0].id === nb2.id, 'related notebook entry linked');
  assert(Boolean(nbDetail.topic) && Boolean(nbDetail.phase), 'notebook detail resolves topic + phase refs');
  assert(allNb.total >= 2, 'notebook list returns entries');
  assert(byPattern.items.every((i) => i.pattern === nb1.pattern), 'pattern filter works');
  assert(highConf.items.every((i) => i.confidence >= 80), 'confidence filter works');
  assert(searchNb.total >= 1, 'full-text search matches');
  assert(nbFacets.patterns.length >= 1 && nbFacets.platforms.length >= 3, 'notebook facets');

  const nbActivity = await activityService.getRecent(DEMO_USER, 40);
  assert(
    nbActivity.some((a) => a.type === 'notebook-created') &&
      nbActivity.some((a) => a.type === 'problem-documented') &&
      nbActivity.some((a) => a.type === 'notebook-updated'),
    'notebook activity events (created + documented + updated)',
  );

  // Relationship integrity: deleting nb2 unlinks it from nb1.relatedEntries.
  await notebookService.remove(DEMO_USER, nb2.id);
  const nb1AfterDelete = await notebookService.getById(DEMO_USER, nb1.id);
  assert(nb1AfterDelete.relatedEntries.length === 0, 'deleting an entry unlinks it from related entries');

  // --- Module 2 · Sprint 4: Learning Integration Engine ---
  // Kadane's topic was unlocked earlier by completing Sliding Window.
  const s4Problem = await Problem.findOne({ title: 'Maximum Subarray' }).exec();
  const s4HttpProblem = await Problem.findOne({ title: 'Maximum Sum Circular Subarray' }).exec();
  assert(Boolean(s4Problem && s4HttpProblem), 'Sprint 4 target problems exist');
  const s4ProblemId = String(s4Problem!._id);
  const s4TopicId = String(s4Problem!.topicId);
  const s4HttpProblemId = String(s4HttpProblem!._id);

  const s4Before = await progressService.getOverview(DEMO_USER);
  const s4MasteryBefore = s4Before.topics.find((t) => t.topicId === s4TopicId)?.mastery ?? 0;

  // Solve it → the whole chain runs (attempt → mastery → recommendation → activity).
  const s4Impact = await workspaceService.completeProblem(DEMO_USER, s4ProblemId, { language: 'C++', durationMinutes: 15 });
  const s4Up = await userProblemRepository.findByUserAndProblem(DEMO_USER, s4ProblemId);
  const s4Ws = await workspaceService.getWorkspace(DEMO_USER, s4ProblemId);

  console.log(
    `integration: solved "${s4Problem!.title}" masteryBefore=${s4MasteryBefore} → after=${s4Impact.currentMastery} ` +
      `delta=${s4Impact.masteryDelta} topicCompleted=${s4Impact.topicCompleted} ` +
      `dashMastery=${s4Impact.dashboard.overallMastery}% rec=[${s4Impact.recommendation.type}]`,
  );
  console.log(
    `  workspace: status=${s4Ws.learningStatus} related=${s4Ws.relatedProblems.length} activity=${s4Ws.activity.length} ` +
      `summarySolved=${s4Ws.attemptSummary.solved}`,
  );

  assert(s4Impact.alreadyCompleted === false, 'first completion is applied');
  assert(s4Impact.masteryBefore === s4MasteryBefore, 'impact reports mastery before');
  assert(s4Impact.masteryDelta !== null && s4Impact.masteryDelta > 0, 'solving an unlocked topic raises mastery');
  assert(s4Impact.currentMastery > s4MasteryBefore, 'topic mastery increased');
  assert(s4Impact.topicProgress !== null && s4Impact.dashboard.overallMastery >= 0, 'impact carries topic + dashboard');
  assert(s4Up !== null && s4Up.solved && s4Up.totalAttempts >= 1, 'UserProblem synced solved via completion');
  assert(s4Ws.problem.id === s4ProblemId && s4Ws.attemptSummary.solved, 'workspace aggregates the solved problem');
  assert(s4Ws.learningStatus === 'Solved', 'solved-without-notebook → Solved status');
  assert(s4Ws.relatedProblems.every((r) => r.id !== s4ProblemId), 'related problems exclude self');
  assert(Boolean(s4Ws.learningSummary.topic) && Boolean(s4Ws.learningSummary.recommendation), 'workspace learning summary resolved');

  // Idempotent completion — no double mastery bump.
  const s4Impact2 = await workspaceService.completeProblem(DEMO_USER, s4ProblemId, {});
  const s4After2 = await progressService.getOverview(DEMO_USER);
  const s4MasteryAfter2 = s4After2.topics.find((t) => t.topicId === s4TopicId)?.mastery ?? 0;
  assert(s4Impact2.alreadyCompleted === true, 'duplicate completion is idempotent (no-op)');
  assert(s4MasteryAfter2 === s4Impact.currentMastery, 'duplicate completion does not double-bump mastery');

  // Solved + documented (with metadata) → Mastered status.
  await notebookService.create(DEMO_USER, {
    problemId: s4ProblemId, observation: 'running max ending here', coreAlgorithm: 'best = max(x, best+x)',
  });
  const s4WsMastered = await workspaceService.getWorkspace(DEMO_USER, s4ProblemId);
  assert(s4WsMastered.learningStatus === 'Mastered', 'solved + documented + metadata → Mastered');

  // Read-only impact snapshot.
  const s4Read = await learningIntegrationService.getLearningImpact(DEMO_USER, s4ProblemId);
  assert(s4Read.masteryBefore === null && s4Read.currentMastery >= 0, 'learning-impact read snapshot');

  const s4Activity = await activityService.getRecent(DEMO_USER, 40);
  assert(
    s4Activity.some((a) => a.type === 'problem-solved') &&
      s4Activity.some((a) => a.type === 'topic-started' || a.type === 'mastery-updated' || a.type === 'topic-completed'),
    'completion generates problem + topic-progress activity',
  );

  // --- Module 3 · Sprint 1: Revision Scheduler & Daily Queue ---
  const RDAY = 24 * 60 * 60_000;
  const rIso = (offsetDays: number) => new Date(seedNow.getTime() + offsetDays * RDAY).toISOString();

  const overdueSched = await revisionScheduleService.create(DEMO_USER, {
    entityType: 'pattern', entityId: 'pattern:sw', title: 'Sliding Window pattern', priority: 5, nextReviewDate: rIso(-2),
  });
  const dueSched = await revisionScheduleService.create(DEMO_USER, {
    entityType: 'pattern', entityId: 'pattern:tp', title: 'Two Pointers pattern', priority: 4, nextReviewDate: rIso(0),
  });
  const upSched = await revisionScheduleService.create(DEMO_USER, {
    entityType: 'pattern', entityId: 'pattern:ps', title: 'Prefix Sum pattern', priority: 3, nextReviewDate: rIso(3),
  });

  const defaultSched = await revisionScheduleService.create(DEMO_USER, {
    entityType: 'pattern', entityId: 'pattern:default', title: 'Default-strategy pattern',
  });

  let rDupThrew = false;
  try {
    await revisionScheduleService.create(DEMO_USER, { entityType: 'pattern', entityId: 'pattern:sw', title: 'dup' });
  } catch {
    rDupThrew = true;
  }
  const ensured = await revisionScheduleService.ensureScheduleFor(DEMO_USER, {
    entityType: 'pattern', entityId: 'pattern:sw', title: 'dup',
  });

  const rList = await revisionScheduleService.list(DEMO_USER, { page: 1, pageSize: 100, sort: 'nextReviewDate', order: 'asc' });
  const queue = await revisionQueueService.getToday(DEMO_USER);
  const cal = await revisionQueueService.getCalendar(DEMO_USER, new Date(seedNow.getTime() - 7 * RDAY), new Date(seedNow.getTime() + 30 * RDAY));

  console.log(
    `revision: schedules=${rList.total} auto(knowledgeEntry)=${rList.items.filter((s) => s.entityType === 'knowledgeEntry').length} | ` +
      `queue overdue=${queue.overdue.length} due=${queue.dueToday.length} upcoming=${queue.upcoming.length} ` +
      `est=${queue.summary.estimatedReviewMinutes}m | calendarDays=${cal.days.length}`,
  );

  assert(overdueSched.urgency === 'overdue' && overdueSched.status === 'Overdue', 'past date → Overdue');
  assert(dueSched.urgency === 'due' && dueSched.status === 'Due', 'today → Due');
  assert(upSched.urgency === 'upcoming' && upSched.status === 'Pending', 'future → upcoming/Pending');
  assert(defaultSched.currentInterval === 1 && defaultSched.daysUntilReview === 1, 'default strategy → first review in 1 day');
  assert(rDupThrew, 'duplicate schedule for same entity rejected');
  assert(ensured === null, 'ensureScheduleFor is idempotent (no-op when active exists)');
  assert(rList.total >= 4, 'schedules listed');
  assert(rList.items.some((s) => s.entityType === 'knowledgeEntry'), 'notebook creation auto-scheduled a revision');
  assert(queue.overdue.length >= 1 && queue.dueToday.length >= 1 && queue.upcoming.length >= 1, 'daily queue buckets populated');
  assert(queue.summary.estimatedReviewMinutes > 0 && queue.summary.totalScheduled === rList.total, 'queue summary counts');
  assert(cal.days.some((d) => d.total > 0), 'calendar groups revision events by date');

  const updatedSched = await revisionScheduleService.update(DEMO_USER, upSched.id, { priority: 5, title: 'Prefix Sum (edited)' });
  assert(updatedSched.priority === 5 && updatedSched.title === 'Prefix Sum (edited)', 'schedule update applies');

  const recalced = await revisionScheduleService.recalculate(DEMO_USER, overdueSched.id);
  assert(recalced.reviewCount === overdueSched.reviewCount + 1 && recalced.daysUntilReview >= 0, 'recalculate advances the review');

  await revisionScheduleService.remove(DEMO_USER, dueSched.id);
  let rGone = false;
  try {
    await revisionScheduleService.getById(DEMO_USER, dueSched.id);
  } catch {
    rGone = true;
  }
  assert(rGone, 'deleted schedule is not retrievable');

  const dashWithRevision = await dashboardService.get(DEMO_USER);
  assert(
    typeof dashWithRevision.revision.dueTodayCount === 'number' &&
      dashWithRevision.revision.totalScheduled >= 1 &&
      Array.isArray(dashWithRevision.revision.preview),
    'dashboard exposes the revision widget',
  );

  const rActivity = await activityService.getRecent(DEMO_USER, 50);
  assert(rActivity.some((a) => a.type === 'revision-scheduled'), 'revision-scheduled activity generated');

  // --- Module 3 · Sprint 2: Revision Workspace & Sessions ---
  // Start a session from the (still active) Prefix Sum pattern schedule.
  const sess = await revisionSessionService.start(DEMO_USER, { scheduleId: upSched.id, selfConfidenceBefore: 55 });
  assert(sess.sessionStatus === 'Started' && sess.entityType === 'pattern' && sess.revisionScheduleId === upSched.id, 'session starts from a schedule');

  let sessDupThrew = false;
  try {
    await revisionSessionService.start(DEMO_USER, { entityType: 'topic', entityId: sw.id });
  } catch {
    sessDupThrew = true;
  }
  assert(sessDupThrew, 'only one active session per user');

  const activeNow = await revisionSessionService.getActive(DEMO_USER);
  assert(activeNow !== null && activeNow.id === sess.id, 'active session is retrievable');

  // Workspace content reuses Module 2 (knowledge entry + topic), no duplicate storage.
  const nbContent = await revisionWorkspaceService.getContent(DEMO_USER, 'knowledgeEntry', nb1.id);
  const topicContent = await revisionWorkspaceService.getContent(DEMO_USER, 'topic', sw.id);
  const sessWs = await revisionWorkspaceService.getWorkspace(DEMO_USER, { scheduleId: upSched.id });

  console.log(
    `session: started "${sess.title}" | nbContent keywords=${nbContent.recognitionKeywords.length} ` +
      `repProblems=${nbContent.representativeProblems.length} traps=${nbContent.contestTraps.length} | ` +
      `topicContent coreIdea=${topicContent.coreIdea.length > 0} whenToUse=${topicContent.whenToUse.length > 0}`,
  );

  assert(nbContent.hasNotebook && nbContent.coreIdea.length > 0 && nbContent.recognitionKeywords.length > 0, 'knowledge-entry content composed from Module 2');
  assert(nbContent.representativeProblems.length >= 1, 'workspace resolves representative problems from the library');
  assert(topicContent.entityType === 'topic' && topicContent.whenToUse.length > 0 && topicContent.contestTraps.length >= 0, 'topic content composed');
  assert(sessWs.activeSession !== null && sessWs.content.entityType === 'pattern' && sessWs.schedule !== null, 'workspace bundles content + session + schedule');

  // Pause / resume / notes.
  await revisionSessionService.update(DEMO_USER, sess.id, { action: 'pause' });
  await revisionSessionService.update(DEMO_USER, sess.id, { action: 'resume' });
  const noted = await revisionSessionService.update(DEMO_USER, sess.id, { reviewNotes: 'Re-derived prefix[r]-prefix[l].' });
  assert(noted.reviewNotes.includes('prefix'), 'review notes saved');

  // Complete → advances the owning schedule via the Sprint-1 strategy.
  const completed = await revisionSessionService.complete(DEMO_USER, {
    sessionId: sess.id, durationMinutes: 10, reviewNotes: 'Solid.', selfConfidenceAfter: 80, reviewedProblems: ['x'],
  });
  const advancedSchedule = await revisionScheduleService.getById(DEMO_USER, upSched.id);
  assert(completed.sessionStatus === 'Completed' && completed.durationMinutes === 10 && completed.selfConfidenceAfter === 80, 'session completes with stored values');
  assert(advancedSchedule.reviewCount === 1 && advancedSchedule.daysUntilReview > 0, 'completing a session advances the schedule');

  let completeAgainThrew = false;
  try {
    await revisionSessionService.complete(DEMO_USER, { sessionId: sess.id });
  } catch {
    completeAgainThrew = true;
  }
  assert(completeAgainThrew, 'a session cannot be completed twice / without being active');
  assert((await revisionSessionService.getActive(DEMO_USER)) === null, 'no active session after completion');

  // Abandon flow.
  const sess2 = await revisionSessionService.start(DEMO_USER, { entityType: 'topic', entityId: sw.id });
  const abandoned = await revisionSessionService.update(DEMO_USER, sess2.id, { action: 'abandon' });
  assert(abandoned.sessionStatus === 'Abandoned' && (await revisionSessionService.getActive(DEMO_USER)) === null, 'session can be abandoned');

  // History + dashboard + activity.
  const sessHistory = await revisionSessionService.history(DEMO_USER, { page: 1, pageSize: 20, sort: 'recent' });
  const entityHistory = await revisionSessionService.historyByEntity(DEMO_USER, 'pattern:ps');
  const dashSession = await dashboardService.get(DEMO_USER);
  const sessActivity = await activityService.getRecent(DEMO_USER, 60);

  console.log(
    `  history total=${sessHistory.total} entityHistory=${entityHistory.length} | ` +
      `dashboard activeSession=${dashSession.revision.activeSession ? 'yes' : 'no'} completedToday=${dashSession.revision.completedToday} ` +
      `recent=${dashSession.revision.recentSessions.length}`,
  );

  assert(sessHistory.total >= 2 && sessHistory.items[0].sessionStatus !== undefined, 'session history stored');
  assert(entityHistory.length >= 1, 'per-entity history works');
  assert(dashSession.revision.activeSession === null && dashSession.revision.completedToday >= 1, 'dashboard reflects sessions');
  assert(Array.isArray(dashSession.revision.recentSessions) && dashSession.revision.recentSessions.length >= 1, 'dashboard recent sessions');
  assert(
    sessActivity.some((a) => a.type === 'revision-started') &&
      sessActivity.some((a) => a.type === 'revision-completed') &&
      sessActivity.some((a) => a.type === 'revision-paused') &&
      sessActivity.some((a) => a.type === 'revision-notes-updated'),
    'session activity events generated',
  );

  // --- Module 3 · Sprint 3: Retention Engine, Confidence Decay & Mastery Sync ---
  // The pattern:ps session completed above auto-synced a retention profile.
  const retProfile = await retentionService.getByEntity(DEMO_USER, 'pattern:ps');
  assert(retProfile !== null, 'revision completion auto-created a retention profile');
  assert(retProfile!.reviewCount === 1 && retProfile!.successfulReviews === 1, 'retention counters updated after a review');
  assert(retProfile!.confidenceScore > 50 && retProfile!.history.length >= 1, 'confidence boosted + snapshot recorded after review');

  // Topic-linked review → mastery synchronisation (reuses Module 1 engine, not duplicated).
  const topicSess = await revisionSessionService.start(DEMO_USER, { entityType: 'topic', entityId: sw.id });
  await revisionSessionService.complete(DEMO_USER, { sessionId: topicSess.id, selfConfidenceAfter: 85 });
  const topicRet = await retentionService.getByEntity(DEMO_USER, sw.id);
  assert(topicRet !== null && topicRet!.topicId === sw.id, 'topic review created a topic-linked retention profile (mastery-synced)');

  // Manual confidence override recomputes retention + level.
  const retUpdated = await retentionService.update(DEMO_USER, 'pattern:ps', { confidenceScore: 95 });
  assert(retUpdated.confidenceScore === 95 && retUpdated.retentionScore >= retProfile!.retentionScore, 'manual confidence override recomputes retention');

  // Overview + confidence + history aggregates.
  const retOverview = await retentionService.overview(DEMO_USER);
  const confOverview = await retentionService.confidence(DEMO_USER);
  const retHistory = await retentionService.history(DEMO_USER, 20);
  console.log(
    `  retention: profiles=${retOverview.totalProfiles} avgConf=${retOverview.averageConfidence} ` +
      `avgRet=${retOverview.averageRetention} atRisk=${retOverview.atRiskCount} mastered=${retOverview.masteredCount} ` +
      `trend=${retOverview.confidenceTrend.direction} historyRows=${retHistory.length}`,
  );
  assert(retOverview.totalProfiles >= 2 && retOverview.averageConfidence > 0, 'retention overview aggregates profiles');
  assert(['rising', 'falling', 'stable'].includes(retOverview.confidenceTrend.direction), 'overview exposes a confidence trend');
  assert(confOverview.entries.length >= 2 && confOverview.averageConfidence > 0, 'confidence overview lists entities');
  assert(retHistory.length >= 1, 'retention history rows returned');

  // Background decay job runs, is safe, and processes profiles.
  const decayResult = await retentionService.applyDecayForAll(DEMO_USER);
  assert(decayResult.processed >= 2, 'background decay processes all profiles');

  // Dashboard exposes the retention widget.
  const dashRet = await dashboardService.get(DEMO_USER);
  assert(
    typeof dashRet.retention.averageConfidence === 'number' && dashRet.retention.averageConfidence >= 0,
    'dashboard exposes the retention widget',
  );

  // --- Module 3 · Sprint 4: Learning-OS dashboard aggregation ---
  console.log(
    `  dashboard-os: knowledge{entries=${dashRet.knowledge.knowledgeEntries} patterns=${dashRet.knowledge.patternsLearned} ` +
      `coverage=${dashRet.knowledge.notebookCoveragePercent}%} plan{priority=${dashRet.todayPlan.priority} due=${dashRet.todayPlan.revisionsDue} ` +
      `study=${dashRet.todayPlan.estimatedStudyMinutes}m} health{overall=${dashRet.health.overallScore}/${dashRet.health.overallStatus} ` +
      `indicators=${dashRet.health.indicators.length}} actions=${dashRet.quickActions.length}`,
  );
  assert(
    dashRet.knowledge.knowledgeEntries >= 1 && dashRet.knowledge.notebookCoveragePercent >= 0,
    'dashboard exposes the knowledge summary',
  );
  assert(
    dashRet.todayPlan.recommendation !== undefined &&
      ['high', 'medium', 'low'].includes(dashRet.todayPlan.priority) &&
      dashRet.todayPlan.estimatedRevisionMinutes >= 0,
    'dashboard exposes today\'s plan',
  );
  assert(
    dashRet.health.indicators.length === 4 &&
      dashRet.health.indicators.every((h) => h.score >= 0 && h.score <= 100 && ['excellent', 'good', 'fair', 'at-risk'].includes(h.status)) &&
      dashRet.health.overallScore >= 0 && dashRet.health.overallScore <= 100,
    'dashboard exposes the learning-health panel',
  );
  assert(
    dashRet.quickActions.length >= 6 &&
      dashRet.quickActions.some((a) => a.kind === 'continue-learning' && a.primary && a.enabled) &&
      dashRet.quickActions.every((a) => typeof a.to === 'string' && a.to.startsWith('/')),
    'dashboard exposes quick actions into existing routes',
  );

  // Retention/confidence activity events generated.
  const retActivity = await activityService.getRecent(DEMO_USER, 100);
  assert(retActivity.some((a) => a.type === 'retention-updated'), 'retention-updated activity generated');
  assert(retActivity.some((a) => a.type === 'confidence-increased'), 'confidence-increased activity generated');

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

  // Module 2 · Sprint 3 — notebook endpoints over HTTP.
  const httpNbCreate = await sendJson('POST', '/api/notebook', {
    problemId: nbHttpProblemId, confidence: 50, observation: 'opposite-end pointers',
  });
  const createdNbId = (httpNbCreate.body.data as { id?: string } | undefined)?.id ?? '';
  const httpNbList = await getJson('/api/notebook?pageSize=5&sort=confidence');
  const httpNbSearch = await getJson('/api/notebook/search?q=prefix');
  const httpNbFacets = await getJson('/api/notebook/facets');
  const httpNbGet = await getJson(`/api/notebook/${createdNbId}`);
  const httpNbPatch = await sendJson('PATCH', `/api/notebook/${createdNbId}`, { confidence: 75, review: true });
  const httpNbDelete = await sendJson('DELETE', `/api/notebook/${createdNbId}`);
  const httpNbMissingProblem = await sendJson('POST', '/api/notebook', { problemId: '64b2f0000000000000000000' });
  const httpNbBadConf = await sendJson('POST', '/api/notebook', { problemId: nbBadConfProblemId, confidence: 150 });

  // Module 2 · Sprint 4 — workspace + integration endpoints over HTTP.
  const httpWorkspace = await getJson(`/api/problems/${s4ProblemId}/workspace`);
  const httpComplete = await sendJson('POST', `/api/problems/${s4HttpProblemId}/complete`, { language: 'Python' });
  const httpCompleteAgain = await sendJson('POST', `/api/problems/${s4HttpProblemId}/complete`, {});
  const httpImpact = await getJson(`/api/problems/${s4HttpProblemId}/learning-impact`);
  const httpWorkspaceBadId = await getJson('/api/problems/not-an-id/workspace');
  const httpCompleteMissing = await sendJson('POST', '/api/problems/64b2f0000000000000000000/complete', {});

  // Module 3 · Sprint 1 — revision endpoints over HTTP.
  const httpRevCreate = await sendJson('POST', '/api/revision/schedules', {
    entityType: 'pattern', entityId: 'pattern:http', title: 'HTTP pattern', nextReviewDate: rIso(0),
  });
  const createdRevId = (httpRevCreate.body.data as { id?: string } | undefined)?.id ?? '';
  const httpRevList = await getJson('/api/revision/schedules?pageSize=5&status=Overdue');
  const httpRevGet = await getJson(`/api/revision/schedules/${createdRevId}`);
  const httpRevPatch = await sendJson('PATCH', `/api/revision/schedules/${createdRevId}`, { priority: 5 });
  const httpRevToday = await getJson('/api/revision/today');
  const httpRevCalendar = await getJson('/api/revision/calendar');
  const httpRevDelete = await sendJson('DELETE', `/api/revision/schedules/${createdRevId}`);
  const httpRevDup = await sendJson('POST', '/api/revision/schedules', {
    entityType: 'pattern', entityId: 'pattern:sw', title: 'dup',
  });
  const httpRevBadId = await getJson('/api/revision/schedules/not-an-id');

  // Module 3 · Sprint 2 — session + workspace endpoints over HTTP.
  const httpSessStart = await sendJson('POST', '/api/revision/session/start', { scheduleId: defaultSched.id, selfConfidenceBefore: 60 });
  const createdSessId = (httpSessStart.body.data as { id?: string } | undefined)?.id ?? '';
  const httpSessActive = await getJson('/api/revision/session/active');
  const httpSessPatch = await sendJson('PATCH', `/api/revision/session/${createdSessId}`, { action: 'pause' });
  const httpSessGet = await getJson(`/api/revision/session/${createdSessId}`);
  const httpSessWorkspace = await getJson(`/api/revision/workspace?scheduleId=${defaultSched.id}`);
  const httpSessComplete = await sendJson('POST', '/api/revision/session/complete', { sessionId: createdSessId, durationMinutes: 6 });
  const httpSessHistory = await getJson('/api/revision/history?pageSize=5');
  const httpSessEntityHistory = await getJson(`/api/revision/history/${encodeURIComponent('pattern:default')}`);
  const httpSessRestart = await sendJson('POST', '/api/revision/session/start', { scheduleId: defaultSched.id });
  const httpSessDup = await sendJson('POST', '/api/revision/session/start', { scheduleId: overdueSched.id });
  const httpWorkspaceNoParams = await getJson('/api/revision/workspace');
  const httpSessBadId = await getJson('/api/revision/session/not-an-id');
  // Module 3 · Sprint 3 retention/confidence requests (before the server closes).
  const httpRetList = await getJson('/api/retention');
  const httpRetOverview = await getJson('/api/retention/overview');
  const httpRetHistory = await getJson('/api/retention/history?limit=10');
  const retEntityPath = `/api/retention/${encodeURIComponent('pattern:ps')}`;
  const httpRetEntity = await getJson(retEntityPath);
  const httpRetPatch = await sendJson('PATCH', retEntityPath, { confidenceScore: 88 });
  const httpConfidence = await getJson('/api/confidence');
  const httpRetMissing = await getJson('/api/retention/no-such-entity');
  const httpRetBadPatch = await sendJson('PATCH', retEntityPath, { confidenceScore: 150 });
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
  // Module 2 · Sprint 3 HTTP assertions:
  console.log(
    `http notebook: create=${httpNbCreate.status} list=${httpNbList.status} search=${httpNbSearch.status} ` +
      `facets=${httpNbFacets.status} get=${httpNbGet.status} patch=${httpNbPatch.status} delete=${httpNbDelete.status} ` +
      `missingProblem=${httpNbMissingProblem.status} badConf=${httpNbBadConf.status}`,
  );
  assert(httpNbCreate.status === 201 && httpNbCreate.body.success, 'POST /notebook → 201');
  assert(httpNbList.status === 200, 'GET /notebook → 200');
  assert(httpNbSearch.status === 200, 'GET /notebook/search → 200');
  assert(httpNbFacets.status === 200, 'GET /notebook/facets → 200');
  assert(httpNbGet.status === 200, 'GET /notebook/:id → 200');
  assert(httpNbPatch.status === 200, 'PATCH /notebook/:id → 200');
  assert(httpNbDelete.status === 200, 'DELETE /notebook/:id → 200');
  assert(httpNbMissingProblem.status === 404, 'POST /notebook missing problem → 404');
  assert(httpNbBadConf.status === 400, 'POST /notebook bad confidence → 400');
  // Module 2 · Sprint 4 HTTP assertions:
  console.log(
    `http workspace: workspace=${httpWorkspace.status} complete=${httpComplete.status} ` +
      `completeAgain=${httpCompleteAgain.status} impact=${httpImpact.status} badId=${httpWorkspaceBadId.status} ` +
      `missing=${httpCompleteMissing.status}`,
  );
  assert(httpWorkspace.status === 200 && httpWorkspace.body.success, 'GET /problems/:id/workspace → 200');
  assert(httpComplete.status === 200 && httpComplete.body.success, 'POST /problems/:id/complete → 200');
  assert(httpCompleteAgain.status === 200, 'duplicate complete is graceful → 200');
  assert(httpImpact.status === 200, 'GET /problems/:id/learning-impact → 200');
  assert(httpWorkspaceBadId.status === 400, 'workspace invalid id → 400');
  assert(httpCompleteMissing.status === 404, 'complete missing problem → 404');
  // Module 3 · Sprint 1 HTTP assertions:
  console.log(
    `http revision: create=${httpRevCreate.status} list=${httpRevList.status} get=${httpRevGet.status} ` +
      `patch=${httpRevPatch.status} today=${httpRevToday.status} calendar=${httpRevCalendar.status} ` +
      `delete=${httpRevDelete.status} dup=${httpRevDup.status} badId=${httpRevBadId.status}`,
  );
  assert(httpRevCreate.status === 201 && httpRevCreate.body.success, 'POST /revision/schedules → 201');
  assert(httpRevList.status === 200, 'GET /revision/schedules → 200');
  assert(httpRevGet.status === 200, 'GET /revision/schedules/:id → 200');
  assert(httpRevPatch.status === 200, 'PATCH /revision/schedules/:id → 200');
  assert(httpRevToday.status === 200 && httpRevToday.body.success, 'GET /revision/today → 200');
  assert(httpRevCalendar.status === 200 && httpRevCalendar.body.success, 'GET /revision/calendar → 200');
  assert(httpRevDelete.status === 200, 'DELETE /revision/schedules/:id → 200');
  assert(httpRevDup.status === 409, 'duplicate schedule → 409');
  assert(httpRevBadId.status === 400, 'invalid schedule id → 400');
  // Module 3 · Sprint 2 HTTP assertions:
  console.log(
    `http session: start=${httpSessStart.status} active=${httpSessActive.status} patch=${httpSessPatch.status} ` +
      `get=${httpSessGet.status} workspace=${httpSessWorkspace.status} complete=${httpSessComplete.status} ` +
      `history=${httpSessHistory.status} entityHistory=${httpSessEntityHistory.status} restart=${httpSessRestart.status} ` +
      `dup=${httpSessDup.status} noParams=${httpWorkspaceNoParams.status} badId=${httpSessBadId.status}`,
  );
  assert(httpSessStart.status === 201 && httpSessStart.body.success, 'POST /session/start → 201');
  assert(httpSessActive.status === 200, 'GET /session/active → 200');
  assert(httpSessPatch.status === 200, 'PATCH /session/:id → 200');
  assert(httpSessGet.status === 200, 'GET /session/:id → 200');
  assert(httpSessWorkspace.status === 200 && httpSessWorkspace.body.success, 'GET /workspace → 200');
  assert(httpSessComplete.status === 200, 'POST /session/complete → 200');
  assert(httpSessHistory.status === 200 && httpSessHistory.body.success, 'GET /history → 200');
  assert(httpSessEntityHistory.status === 200, 'GET /history/:entityId → 200');
  assert(httpSessRestart.status === 201, 'restart after completion → 201');
  assert(httpSessDup.status === 409, 'second active session → 409');
  assert(httpWorkspaceNoParams.status === 400, 'workspace without params → 400');
  assert(httpSessBadId.status === 400, 'invalid session id → 400');

  // Module 3 · Sprint 3 HTTP assertions:
  console.log(
    `http retention: list=${httpRetList.status} overview=${httpRetOverview.status} history=${httpRetHistory.status} ` +
      `entity=${httpRetEntity.status} patch=${httpRetPatch.status} confidence=${httpConfidence.status} ` +
      `missing=${httpRetMissing.status} badPatch=${httpRetBadPatch.status}`,
  );
  assert(httpRetList.status === 200 && httpRetList.body.success, 'GET /retention → 200');
  assert(httpRetOverview.status === 200 && httpRetOverview.body.success, 'GET /retention/overview → 200');
  assert(httpRetHistory.status === 200 && httpRetHistory.body.success, 'GET /retention/history → 200');
  assert(httpRetEntity.status === 200 && httpRetEntity.body.success, 'GET /retention/:entityId → 200');
  assert(httpRetPatch.status === 200, 'PATCH /retention/:entityId → 200');
  assert(httpConfidence.status === 200 && httpConfidence.body.success, 'GET /confidence → 200');
  assert(httpRetMissing.status === 404, 'GET /retention missing entity → 404');
  assert(httpRetBadPatch.status === 400, 'PATCH /retention bad confidence → 400');

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
