# Module 6 · Sprint 1 — Reward Engine, XP, Levels & Streaks (Progression Engine)

A centralised, **event-driven Progression Engine**. Every learning action already
flows through the Activity system; this sprint makes the **Reward Engine** listen
to that stream and turn eligible activities into **XP → Levels → Streaks →
Reward History → progression events**. Modules never award XP directly — the
Reward Engine is the *only* place XP is minted.

```
Activity Event → Reward Engine → XP → Level → Streak → Dashboard
```

Out of scope (Sprint 2): achievements, badges, challenges, celebration
animations, leaderboards, AI motivation, social gamification. The architecture is
built so those land **without refactoring** (see §10).

---

## 1. Updated Folder Structure

`＋` new · `~` extended.

```
backend/src/
├── config/gamification.ts                          ＋ REWARD_RULES (XP table) · LEVEL_CONFIG · LEVEL_TIERS · STREAK_CONFIG
├── models/UserProgression.ts                       ＋ per-user progression snapshot (+ indexes)
├── models/RewardHistory.ts                         ＋ immutable reward ledger (unique {userId,activityId})
├── gamification/                                   ＋ SELF-CONTAINED module
│   ├── repositories/userProgression.repository.ts  ＋ getOrCreate · atomic incrementXP · applyDerived
│   ├── repositories/rewardHistory.repository.ts    ＋ create(dedupe) · query(filter/paginate) · sumXpSince · dailyTotals
│   ├── services/rewardRule.service.ts              ＋ configurable XP-rule lookup (RewardRuleService)
│   ├── services/level.service.ts                   ＋ level math + LEVEL_FORMULAS registry (LevelService)
│   ├── services/streak.service.ts                  ＋ daily-streak math (StreakService)
│   ├── services/rewardEngine.service.ts            ＋ THE engine — the only XP minter
│   ├── services/gamificationActivity.ts            ＋ emits xp-awarded / level-up / streak-* back to Activity
│   ├── services/progression.service.ts             ＋ read model (summary/rewards/levels/streaks) + cache
│   ├── services/progressionCache.ts                ＋ per-user TTL cache for the summary
│   ├── dto/gamification.dto.ts                      ＋ API DTOs (frozen contract)
│   ├── validators/gamification.validator.ts        ＋ reward-history query (zod)
│   ├── controllers/gamification.controller.ts      ＋ progression · rewards · rewards/history · levels · streaks
│   ├── routes/gamification.routes.ts               ＋ /api/gamification/*
│   └── index.ts                                     ＋ initGamification() — subscribes engine to the activity bus
├── services/activity.service.ts                    ~ added an in-process subscriber BUS (subscribe/dispatch)
├── types/domain.ts                                 ~ +5 gamification activity types · 'progression' entity · reward enums
├── routes/index.ts                                 ~ mount /gamification + initGamification()
├── seed/gamification.ts                            ＋ back-dated rewardable demo events
├── seed/seed.ts                                    ~ seedGamification() — REPLAYS events through the real engine
└── tests/gamification.smoke.ts                     ＋ 23-check end-to-end smoke test (npm run test:gamification)

frontend/src/
├── lib/gamification.ts                             ＋ reward-source meta (icon/label/module) · XP formatters
├── api/gamification.api.ts                         ＋ progression/rewards/levels/streaks client
├── hooks/useGamification.ts                        ＋ React Query hooks
├── store/slices/gamificationSlice.ts               ＋ reward filters · sort · page (UI only)
├── components/gamification/ (12)                   ＋ all reusable components (see §8)
├── components/dashboard/ProgressionDashboardCard.tsx ＋ home-dashboard widget (self-fetches)
├── pages/ProgressionPage.tsx                       ＋ full progression dashboard (/progression)
├── lib/queryClient.ts · lib/invalidate.ts          ~ progression query keys + invalidation on learning mutations
├── hooks/useRevisionSession.ts · useContestLearning.ts ~ invalidate gamification after reward-earning mutations
├── store/index.ts                                  ~ register gamification reducer
├── router/index.tsx · layout/Sidebar.tsx           ~ /progression route + Progression nav
└── pages/DashboardPage.tsx                         ~ Progression section on Home
```

**No previous module was rewritten.** The only change to shared code is *additive*:
the Activity service gained a subscriber bus, and two mutation hooks invalidate
one extra query key.

---

## 2. Reward Engine Architecture

The engine is a **subscriber**, not a caller. The Activity system is the single
source of "something happened"; the Reward Engine reacts to it.

```
                    (any module)
                         │  activityService.record(...)
                         ▼
        ┌─────────────────────────────────┐
        │   Activity Service (event bus)   │  ← core, feature-agnostic
        │   create Activity → dispatch()   │
        └─────────────────────────────────┘
                         │  ActivityEvent {id, type, occurredAt, …}
                         ▼  (best-effort, isolated per subscriber)
        ┌─────────────────────────────────┐
        │          Reward Engine           │  ← the ONLY XP minter
        │  rule? → dedupe → XP → level →   │
        │  streak → history → emit events  │
        └─────────────────────────────────┘
             │           │            │
     RewardRuleService  LevelService  StreakService     (pure, DB-free)
             │           │            │
     UserProgressionRepo / RewardHistoryRepo            (DB owners)
                         │
              gamificationActivity → activityService.record(xp-awarded, level-up …)
                         │
                    (loops back to the bus, but those types are non-rewardable → no-op)
```

**Why a bus (not a direct call).** The core Activity service imports *nothing*
from gamification; the feature registers itself in `initGamification()`. This
keeps the dependency direction clean (feature → core), lets Sprint 2
(achievements) subscribe the same way, and means the whole engine can be
enabled/disabled by one subscription.

**The loop-breaker.** The engine *also* emits activities (`xp-awarded`,
`level-up`, …). Those re-enter the bus, but they are **not** in
`REWARDABLE_ACTIVITY_TYPES`, so `RewardRuleService.getRule()` returns `null` and
the engine returns immediately — no recursion, no reward-for-a-reward.

### Reward flow (transactional-by-ordering)

```
Activity Event
   ↓ validate + resolve rule          (non-rewardable → stop)
   ↓ WRITE RewardHistory  ←──────────── idempotency lock (unique {userId,activityId})
   ↓   duplicate? → stop (no XP)
   ↓ award XP (atomic $inc)
   ↓ recompute Level (from new total)
   ↓ advance Streak (dated by occurredAt)
   ↓ persist derived level+streak fields
   ↓ invalidate progression cache
   ↓ emit xp-awarded [+ level-up] [+ streak-increased|broken]
```

**Exactly-once without a DB transaction.** RewardHistory is written *first* and
its unique `{userId, activityId}` index is used as an idempotency lock — a
re-delivered event loses the insert race and aborts *before* any XP moves. The
failure direction is safe: a crash between the log and the `$inc` under-counts
(recoverable by replaying the logs), never double-counts. Where a replica set is
available this upgrades cleanly to a real `session.withTransaction()` (documented
extension point) — the ordering already assumes atomic all-or-nothing.

---

## 3. XP Calculation Strategy

XP is **never hardcoded in the engine** — it is a pure lookup into a configurable
rule table (`config/gamification.ts`, served by `RewardRuleService`):

| Activity (`rewardSource`) | XP | Module |
|---|---|---|
| `problem-solved` | +20 | learning |
| `topic-completed` | +100 | learning |
| `phase-completed` | +500 | learning |
| `revision-completed` | +15 | revision |
| `notebook-created` (knowledge entry) | +30 | knowledge |
| `contest-finished` | +75 | contest |
| `upsolve-completed` | +40 | contest |
| `notebook-updated` | +10 | knowledge |

`RewardRuleService.setRule()` allows runtime retuning (a settings/experimentation
seam). Any activity type absent from the table earns nothing — including the
engine's own emitted events.

---

## 4. Level Progression

`LevelService` owns the math only (no DB). Thresholds are **derived, never
stored**, via a named formula in a registry (mirrors the revision/decay strategy
registries) so new curves plug in with no schema change:

```
cost(L)      = round(baseXP · L^exponent)          // exponential (default: base 100, exp 1.5)
threshold(L) = Σ cost(k) for k in 1..L-1           // cumulative XP to REACH level L
levelForXP   = highest L with threshold(L) ≤ totalXP
```

`compute(totalXP)` returns the fully-resolved state used everywhere:

| Field | Meaning |
|---|---|
| `totalXP` | lifetime cumulative XP (monotonic) |
| `currentXP` | XP within the current level = `totalXP − threshold(level)` |
| `nextLevelXP` | XP span of the current level = `cost(level)` |
| `currentLevelXP` | absolute floor threshold of the current level |
| `xpRemaining` | `nextLevelXP − currentXP` |
| `levelProgress` | `currentXP / nextLevelXP` (0–1) |

Invariant checked by the smoke test: `currentXP + xpRemaining === nextLevelXP`.
Levels also carry a cosmetic **tier** (Novice → Grandmaster) from `LEVEL_TIERS` —
a ready keying surface for Sprint 2 badges.

---

## 5. Streak Calculation Flow

`StreakService` is pure date math over a snapshot + the moment an activity
occurred (UTC day granularity, grace window configurable, default 1 day):

```
first ever            → streak = 1                              (started)
same UTC day as last  → no change                               (continued-same-day)
gap ≤ graceDays        → streak + 1                              (increased / recovered)
gap  > graceDays       → streak = 1                              (broken)
longestStreak = max(longestStreak, currentStreak)   // ratchets up, never down
totalDaysActive += 1 on every NEW day
```

"A day counts only if meaningful learning activity exists" is enforced *upstream*:
only rewardable activities reach the engine, so only they can move a streak.
Streaks are also **re-evaluated at read time** (`isActive`) so a lapsed streak is
never reported as live after a missed day — nothing silently drifts. Transitions
emit `streak-increased` / `streak-broken` activity events.

---

## 6. MongoDB Schemas

**UserProgression** (one per user)

```
userId(unique idx) · currentXP · currentLevel · totalXP · currentLevelXP ·
nextLevelXP · currentStreak · longestStreak · totalDaysActive ·
lastActivityDate · createdAt · updatedAt          index: { userId }
```

Materialised snapshot kept in sync by the engine; always rebuildable by replaying
the logs (which is exactly what the seed does).

**RewardHistory** (immutable ledger)

```
userId · activityId · rewardType('xp'|badge|achievement) · rewardSource(activityType) ·
xpAwarded · reason · metadata · createdAt
  indexes: { userId } · { userId, createdAt:-1 } · UNIQUE { userId, activityId }
```

`createdAt` is explicit (no `timestamps`) — rewards are immutable and the engine
dates each row by when the activity *occurred*, so backfills/replays are correct.
The **UNIQUE `{userId, activityId}`** index is the duplicate-reward guarantee.

---

## 7. API Documentation

All endpoints are `GET`, scoped to the acting user (ownership enforced — every
query is keyed by `userId`; there is no cross-user code path).

| Endpoint | Returns |
|---|---|
| `GET /api/gamification/progression` | summary: level, tier, XP (total/current/remaining), levelProgress, streaks, todaysXP |
| `GET /api/gamification/rewards?limit=` | most recent reward rows |
| `GET /api/gamification/rewards/history` | filtered + paginated history — `rewardType`, `rewardSource`, `from`, `to`, `sort=newest\|oldest`, `limit`, `offset` |
| `GET /api/gamification/levels` | level ladder (cost/threshold/tier per level) + user position + formula |
| `GET /api/gamification/streaks` | current/longest/totalDays, active flag, + N-day daily XP breakdown |

Envelope is the app standard `{ success, data, meta? }`. Bad query params → `400`
with field-level messages (zod).

---

## 8. Component Hierarchy

Reusable set (`components/gamification/`, all design-system aligned, dark/minimal,
framer-motion progress animations, `tabular-nums`):

```
ProgressionSummary                       (composite hero)
├── LevelCard
│   ├── LevelProgressRing                (animated SVG ring)
│   └── XPProgressBar                    (animated fill)
├── XPCard                               (total + today's XP)
└── StreakCard                           (current/longest/active-days)

DailyXPCard          CSS bar chart (no charting dep → safe in eager dashboard)
RewardHistoryTable   Activity · Reward · XP · Reason · Timestamp (h-scroll, filterable)
RewardHistoryCard    single reward row (feed + mobile)
RewardBadge          source-coloured "+N XP" chip
LevelIndicator       inline "Lv 5 · Practitioner" chip
StreakIndicator      inline "🔥 12" chip (glows while live)

Home:  components/dashboard/ProgressionDashboardCard  → DashboardPage "Progression" section
Page:  pages/ProgressionPage (/progression)           → summary + daily activity + level ladder + reward history
```

**State split** (matches the app): React Query owns *all* progression server
state (`useProgression/useRecentRewards/useRewardHistory/useLevels/useStreaks`);
Redux (`gamificationSlice`) holds **UI only** — reward filter, activity-type
filter, sort, date range, page.

---

## 9. Progression Dashboard (description)

*(App requires MongoDB to run; described here — the seed produces this exact
state.)*

- **Home → "Progression" section**: the `ProgressionSummary` hero — a level ring
  (fills to level progress) beside the tier name and "N XP to Lv X", an animated
  XP bar, a Total-XP card with today's earnings, and a Streak card whose flame
  glows while the streak is live — followed by the 4 most recent rewards and a
  "View all" link.
- **/progression (full page)**: header with a live `LevelIndicator`; the full
  summary; a **Daily Activity** bar chart (last 14 days, active days highlighted);
  a **Reward History** table with reward-source filter chips + newest/oldest sort +
  pagination; and a **Level Ladder** rail windowed around the current level
  (reached levels in green, current level ring-highlighted).

With the seed replayed through the real engine, the demo user lands at
**Level 4 (Novice), 1,430 XP (527 / 800 into the level), a 12-day current streak
(longest 12, 15 total active days)**, 30 reward rows and one `streak-broken` event
where the seeded gap falls. *(These are the actual values produced by
`npm run seed` and served by the live API — verified below.)*

---

## 10. Extension Points Prepared for Sprint 2

- **`rewardType` enum** already includes `'badge'` and `'achievement'` — a new
  minting path drops in with no schema change.
- **Activity bus** — achievements/challenges subscribe the same way the Reward
  Engine does (`activityService.subscribe`); they can react to `xp-awarded` /
  `level-up` / `streak-increased` too.
- **`LevelService` formula registry** + **`LEVEL_TIERS`** — new curves and
  tier→badge keying with config-only changes.
- **`RewardRuleService.setRule()`** — runtime-tunable economy for challenges.
- **`RewardHistory.metadata`** (Mixed) — carries badge/challenge context without
  migration.
- **`progressionCache`** — swap the in-process TTL cache for Redis in a
  multi-instance deployment; interface is already isolated.
- **Reward ordering** — upgrades to a real Mongo transaction once a replica set
  is present (the write order already assumes atomicity).

---

## Verification

- `backend: npx tsc --noEmit` → clean.
- `backend: npm run test:gamification` → **23 checks pass** — bus award, level-up,
  multi-day + broken streak, duplicate protection, no-recursion, read model,
  ownership isolation.
- `backend: npm run test:smoke` (existing full integration) → **all assertions
  pass** (engine now subscribed during the HTTP suite — no regressions).
- `frontend: npm run build` (`tsc --noEmit && vite build`) → clean.
- **Live end-to-end** (real `mongod` + `npm run seed` + booted API): all five
  endpoints return correct data — `/progression` (Lv 4, 1430 XP, `527+273=800`,
  streak 12), `/levels` (current marked, exponential thresholds), `/streaks`
  (14-day breakdown showing the gap), `/rewards` (newest-first), and
  `/rewards/history?rewardSource=contest-finished` (filter → 2 rows). 30 reward
  rows for 30 seeded events confirms zero double-awards.

## Success Criteria — met

Reward Engine processes Activity Events ✓ · XP via configurable rules ✓ · Levels
update automatically ✓ · Streaks tracked (incl. broken/recovered) ✓ · Reward
History maintained ✓ · Dashboard shows progression ✓ · Components reusable ✓ ·
Duplicate processing prevented ✓ · Modular + event-driven ✓ · Sprint-2-ready
without refactoring ✓.
