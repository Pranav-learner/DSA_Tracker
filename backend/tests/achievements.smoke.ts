/**
 * Module 6 · Sprint 2 — Achievement System smoke test.
 *
 * Drives the REAL event-driven pipeline (Reward Engine + ProgressionRulesEngine
 * subscribed via initGamification) and asserts achievements, badges, challenges
 * and celebrations behave. Run with: npx tsx tests/achievements.smoke.ts
 */
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { initGamification } from '../src/gamification/index.js';
import { activityService, type ActivityEvent } from '../src/services/activity.service.js';
import { challengeService } from '../src/gamification/services/challenge.service.js';
import { gamificationProfileService } from '../src/gamification/services/gamificationProfile.service.js';
import { achievementRepository } from '../src/gamification/repositories/achievement.repository.js';
import { badgeRepository } from '../src/gamification/repositories/badge.repository.js';
import { challengeRepository } from '../src/gamification/repositories/challenge.repository.js';
import { celebrationRepository } from '../src/gamification/repositories/celebration.repository.js';
import { learningRepository } from '../src/repositories/learning.repository.js';
import { userProgressionRepository } from '../src/gamification/repositories/userProgression.repository.js';
import { progressionCache } from '../src/gamification/services/progressionCache.js';
import { UserProgression } from '../src/models/UserProgression.js';
import { RewardHistory } from '../src/models/RewardHistory.js';
import { Achievement } from '../src/models/Achievement.js';
import { Badge } from '../src/models/Badge.js';
import { Challenge } from '../src/models/Challenge.js';
import { Celebration } from '../src/models/Celebration.js';
import { Activity } from '../src/models/Activity.js';
import { Types } from 'mongoose';

const USER = 'ach-smoke';
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
    Achievement.deleteMany({}),
    Badge.deleteMany({}),
    Challenge.deleteMany({}),
    Celebration.deleteMany({}),
    Activity.deleteMany({}),
  ]);
  progressionCache.clear();
}

let solveSeq = 0;
async function solve(title = `Problem ${(solveSeq += 1)}`): Promise<void> {
  await activityService.record(USER, { type: 'problem-solved', entityType: 'problem', entityId: 'p', title: `Solved ${title}`, description: '' });
}
async function record(type: string, title: string): Promise<void> {
  await activityService.record(USER, { type: type as ActivityEvent['type'], entityType: 'problem', entityId: 'p', title, description: '' });
}

async function main(): Promise<void> {
  const mongo = await MongoMemoryServer.create();
  await connectDatabase(mongo.getUri('cp_os_ach'));
  initGamification();

  try {
    // ── 1. Achievement unlock + bonus XP + idempotency ─────────────────
    await reset();
    await solve('Two Sum');
    let firstAcc = await achievementRepository.findByKey(USER, 'first-accepted');
    check('first-accepted unlocks on first solve', firstAcc?.unlockedAt != null);
    let prog = await userProgressionRepository.getOrCreate(USER);
    check('bonus XP applied through the Reward Engine (20 solve + 25 bonus)', prog.totalXP === 45);

    await solve('Valid Anagram');
    prog = await userProgressionRepository.getOrCreate(USER);
    check('achievement bonus is not granted twice (idempotent)', prog.totalXP === 45 + 20);
    check('an achievement-unlocked activity was emitted', (await Activity.countDocuments({ userId: USER, type: 'achievement-unlocked' })) === 1);
    check('an achievement-unlocked celebration was generated', (await Celebration.countDocuments({ userId: USER, type: 'achievement-unlocked' })) === 1);

    // Reach 10 solves → ten-problems unlocks (already 2 solved → 8 more).
    for (let i = 0; i < 8; i += 1) await solve();
    const ten = await achievementRepository.findByKey(USER, 'ten-problems');
    check('ten-problems unlocks at 10 solves', ten?.unlockedAt != null && ten.progress === 10);

    // ── 2. Badge unlock (via achievement link + own condition) ─────────
    await reset();
    for (let i = 0; i < 5; i += 1) await record('notebook-created', `Note ${i}`);
    check('knowledge-builder achievement unlocks at 5 notes', (await achievementRepository.findByKey(USER, 'knowledge-builder'))?.unlockedAt != null);
    check('knowledge-builder badge is awarded (via achievement link)', await badgeRepository.exists(USER, 'knowledge-builder'));
    check('a badge-earned celebration was generated', (await Celebration.countDocuments({ userId: USER, type: 'badge-earned' })) >= 1);

    // ── 3. Challenge lifecycle: generate → advance → complete ──────────
    await reset();
    await challengeService.ensureActive(USER);
    const active = await challengeRepository.findActive(USER);
    check('recurring + phase challenges are generated', active.some((c) => c.challengeType === 'Daily') && active.some((c) => c.challengeType === 'Weekly'));
    const dailySolve = active.find((c) => c.challengeKey === 'daily-solve-5');
    check('daily "solve 5" challenge exists and is active', dailySolve?.status === 'Active' && dailySolve.targetValue === 5);

    for (let i = 0; i < 5; i += 1) await solve();
    const dailyAfter = await challengeRepository.findById(USER, String(dailySolve!._id));
    check('daily challenge completes at target', dailyAfter?.status === 'Completed' && dailyAfter.currentProgress === 5);
    check('challenge reward XP minted via Reward Engine', (await RewardHistory.countDocuments({ userId: USER, rewardSource: 'challenge-completed' })) >= 1);
    check('a challenge-completed celebration was generated', (await Celebration.countDocuments({ userId: USER, type: 'challenge-completed' })) >= 1);

    // Phase challenge tracks the current phase.
    await reset();
    await learningRepository.upsert(USER, { currentPhaseId: new Types.ObjectId() });
    await challengeService.ensureActive(USER);
    check('a Phase challenge is generated for the current phase', (await challengeRepository.findActive(USER)).some((c) => c.challengeType === 'Phase'));

    // ── 4. Streak milestone celebration (7 consecutive days) ───────────
    await reset();
    const DAY = 86_400_000;
    const base = Date.UTC(2026, 0, 1);
    for (let d = 0; d < 7; d += 1) {
      const ev: ActivityEvent = { id: new Types.ObjectId().toString(), userId: USER, type: 'problem-solved', entityType: 'problem', entityId: 'p', title: 'Solved daily', description: '', occurredAt: new Date(base + d * DAY + 10 * 3_600_000) };
      await activityService.dispatch(ev);
    }
    prog = await userProgressionRepository.getOrCreate(USER);
    check('7 consecutive days build a 7-day streak', prog.currentStreak === 7);
    check('a 7-day streak milestone celebration was generated', (await Celebration.countDocuments({ userId: USER, type: 'milestone-reached' })) === 1);

    // ── 5. Celebrations markSeen + unified profile ─────────────────────
    const unseenBefore = await celebrationRepository.countUnseen(USER);
    check('celebrations start unseen', unseenBefore > 0);
    const modified = await celebrationRepository.markSeen(USER);
    check('markSeen acknowledges all unseen celebrations', modified === unseenBefore && (await celebrationRepository.countUnseen(USER)) === 0);

    const profile = await gamificationProfileService.getProfile(USER);
    check('profile composes progression + achievements + challenges', profile.progression.totalXP > 0 && profile.achievements.total > 0 && profile.challenges.active.length > 0);
    check('profile reports the achievement catalogue total', profile.achievements.total >= 13);

    // ── 6. No-recursion guard: gamification events never earn rule rewards ──
    // ('achievement-unlocked'/'challenge-completed' DO appear as reward sources,
    // but only on intentional bonus rows flagged metadata.bonus — never as a
    // rule-based reward for the emitted event.)
    const strayRewards = await RewardHistory.countDocuments({
      userId: USER,
      rewardSource: { $in: ['xp-awarded', 'level-up', 'streak-increased', 'streak-broken', 'badge-earned', 'milestone-reached', 'progression-updated'] },
    });
    check('emitted gamification/celebration events never earn a reward', strayRewards === 0);
    const bonusRows = await RewardHistory.find({ userId: USER, rewardSource: { $in: ['achievement-unlocked', 'challenge-completed'] } }).exec();
    check('achievement/challenge XP rows are flagged as bonuses', bonusRows.length > 0 && bonusRows.every((r) => (r.metadata as { bonus?: boolean })?.bonus === true));

    // Ownership isolation.
    const other = await gamificationProfileService.getProfile('nobody');
    check('a different user has an empty profile', other.progression.totalXP === 0 && other.achievements.unlocked === 0);

    console.log(`\n✅ Achievement system smoke test passed — ${pass} checks.`);
  } finally {
    await disconnectDatabase();
    await mongo.stop();
  }
}

main().catch((err) => {
  console.error('\n❌ Achievement system smoke test FAILED:', err);
  process.exit(1);
});
