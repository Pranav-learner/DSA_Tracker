/**
 * Module 6 · Sprint 1 — Progression Engine smoke test.
 *
 * Spins up an in-memory MongoDB and drives the REAL event-driven flow: it
 * records activities through activityService (with the Reward Engine subscribed
 * via initGamification) and asserts XP, levels, streaks, dedupe and the read
 * model all behave. Run with: npx tsx tests/gamification.smoke.ts
 */
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { initGamification } from '../src/gamification/index.js';
import { activityService } from '../src/services/activity.service.js';
import { progressionService } from '../src/gamification/services/progression.service.js';
import { levelService } from '../src/gamification/services/level.service.js';
import { rewardEngine } from '../src/gamification/services/rewardEngine.service.js';
import { progressionCache } from '../src/gamification/services/progressionCache.js';
import { UserProgression } from '../src/models/UserProgression.js';
import { RewardHistory } from '../src/models/RewardHistory.js';
import { Activity } from '../src/models/Activity.js';
import { REWARD_RULES } from '../src/config/gamification.js';

const USER = 'smoke-user';

let pass = 0;
function check(label: string, cond: boolean): void {
  assert.ok(cond, `FAILED: ${label}`);
  pass += 1;
  console.log(`  ✓ ${label}`);
}

async function reset(): Promise<void> {
  await Promise.all([
    UserProgression.deleteMany({}),
    RewardHistory.deleteMany({}),
    Activity.deleteMany({}),
  ]);
  progressionCache.clear();
}

async function main(): Promise<void> {
  const mongo = await MongoMemoryServer.create();
  await connectDatabase(mongo.getUri('cp_os_test'));
  initGamification(); // subscribe the Reward Engine to the activity bus

  try {
    // ── 1. A rewardable activity awards XP through the bus ──────────────
    await reset();
    await activityService.record(USER, {
      type: 'problem-solved',
      entityType: 'problem',
      entityId: 'p1',
      title: 'Solved a problem',
      description: '',
    });
    let summary = await progressionService.getSummary(USER);
    check('problem-solved awards +20 XP via the bus', summary.totalXP === REWARD_RULES['problem-solved'].xp);
    check('starts at level 1', summary.level === 1);
    check('streak starts at 1', summary.currentStreak === 1);
    check("today's XP reflects the award", summary.todaysXP === 20);

    const rewardCount = await RewardHistory.countDocuments({ userId: USER });
    check('exactly one reward row written', rewardCount === 1);

    // ── 2. Non-rewardable activity earns nothing (no loop) ─────────────
    progressionCache.clear();
    await activityService.record(USER, {
      type: 'attempt-started',
      entityType: 'problem',
      entityId: 'p1',
      title: 'Started an attempt',
      description: '',
    });
    summary = await progressionService.getSummary(USER);
    check('non-rewardable activity awards no XP', summary.totalXP === 20);

    // Gamification events the engine emitted are themselves non-rewardable:
    const xpAwardedEvents = await Activity.countDocuments({ userId: USER, type: 'xp-awarded' });
    check('engine emitted an xp-awarded activity event', xpAwardedEvents === 1);
    const rewardForEmitted = await RewardHistory.countDocuments({ userId: USER, rewardSource: 'xp-awarded' });
    check('emitted gamification events are never rewarded (no recursion)', rewardForEmitted === 0);

    // ── 3. Duplicate protection: replay the same activity id ───────────
    const dupOutcome = await rewardEngine.processActivityEvent({
      id: 'fixed-activity-id',
      userId: USER,
      type: 'problem-solved',
      entityType: 'problem',
      entityId: 'p2',
      title: 'Solved again',
      description: '',
      occurredAt: new Date(),
    });
    const dupOutcome2 = await rewardEngine.processActivityEvent({
      id: 'fixed-activity-id',
      userId: USER,
      type: 'problem-solved',
      entityType: 'problem',
      entityId: 'p2',
      title: 'Solved again',
      description: '',
      occurredAt: new Date(),
    });
    check('first award for an activity id succeeds', dupOutcome.awarded === true);
    check('second award for the same activity id is skipped (duplicate)', dupOutcome2.skipped === 'duplicate');

    // ── 4. Level-up: award a big lump and check the level math ─────────
    await reset();
    // Push enough XP to cross several levels via a phase-completed (500) chain.
    for (let i = 0; i < 6; i += 1) {
      await rewardEngine.processActivityEvent({
        id: `phase-${i}`,
        userId: USER,
        type: 'phase-completed',
        entityType: 'phase',
        entityId: `ph${i}`,
        title: 'Completed a phase',
        description: '',
        occurredAt: new Date(),
      });
    }
    progressionCache.clear();
    summary = await progressionService.getSummary(USER);
    const expectedLevel = levelService.levelForXP(6 * 500);
    check('level is derived from total XP', summary.level === expectedLevel && summary.level > 1);
    check('level > 1 emitted at least one level-up event', (await Activity.countDocuments({ userId: USER, type: 'level-up' })) >= 1);
    check('xpRemaining + currentXP === nextLevelXP', summary.currentXP + summary.xpRemaining === summary.nextLevelXP);

    // ── 5. Multi-day streak + broken streak ────────────────────────────
    await reset();
    const DAY = 86_400_000;
    const base = Date.UTC(2026, 0, 1); // fixed baseline
    const days = [0, 1, 2, /* gap */ 6, 7]; // 3-day streak, break, 2-day streak
    for (let i = 0; i < days.length; i += 1) {
      await rewardEngine.processActivityEvent({
        id: `streak-${i}`,
        userId: USER,
        type: 'problem-solved',
        entityType: 'problem',
        entityId: 'p',
        title: 'Solved',
        description: '',
        occurredAt: new Date(base + days[i] * DAY + 10 * 3_600_000),
      });
    }
    const prog = await UserProgression.findOne({ userId: USER }).exec();
    check('longest streak captured the early 3-day run', prog?.longestStreak === 3);
    check('current streak reset after the gap (now 2)', prog?.currentStreak === 2);
    check('total distinct active days counted', prog?.totalDaysActive === 5);
    const brokenEvents = await Activity.countDocuments({ userId: USER, type: 'streak-broken' });
    check('a streak-broken event was emitted on the gap', brokenEvents === 1);

    // ── 6. Read model: levels + streaks + history endpoints ────────────
    const levels = await progressionService.getLevels(USER);
    check('levels ladder marks the current level', levels.ladder.some((r) => r.isCurrent));
    const streaks = await progressionService.getStreaks(USER);
    check('streaks daily breakdown has the configured window length', streaks.daily.length === 14);
    const history = await progressionService.getRewardHistory(USER, { limit: 3, skip: 0, sort: 'newest' });
    check('reward history paginates', history.items.length === 3 && history.total === 5);
    check('reward history hasMore is true when more remain', history.hasMore === true);
    const filtered = await progressionService.getRewardHistory(USER, {
      limit: 20,
      skip: 0,
      sort: 'oldest',
      rewardSource: 'problem-solved',
    });
    check('reward history filters by activity type', filtered.items.every((r) => r.rewardSource === 'problem-solved'));

    // ── 7. Ownership isolation ─────────────────────────────────────────
    const otherSummary = await progressionService.getSummary('someone-else');
    check('a different user has an independent (empty) progression', otherSummary.totalXP === 0);

    console.log(`\n✅ Gamification smoke test passed — ${pass} checks.`);
  } finally {
    await disconnectDatabase();
    await mongo.stop();
  }
}

main().catch((err) => {
  console.error('\n❌ Gamification smoke test FAILED:', err);
  process.exit(1);
});
