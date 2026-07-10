# Module 6 · Sprint 2 — Achievement Engine, Challenges, Badges & Celebrations

The sprint that **completes the Gamification Engine**. Sprint 1 turned Activity
Events into XP / Levels / Streaks. Sprint 2 layers **recognition and long-term
engagement** on top — Achievements, Badges, Challenges, Milestones and a
Celebration system — all unlocked **automatically** through configurable rules.

```
Activity Event → Progression Rules Engine → Achievement / Badge / Challenge → Celebration → Dashboard
```

Nothing is hardcoded and no reward logic is duplicated: the new
**ProgressionRulesEngine** subscribes to the SAME Activity bus as Sprint 1's
Reward Engine, reads the progression the Reward Engine just updated, and mints
any bonus XP back through the Reward Engine's own path.

Out of scope (future): social leaderboards, multiplayer challenges, AI motivation,
seasonal events, external integrations.

---

## 1. Updated Folder Structure

`＋` new · `~` extended.

```
backend/src/
├── config/achievements.ts                        ＋ ACHIEVEMENT_DEFS + RuleContext + count/keyword helpers
├── config/badges.ts                              ＋ BADGE_DEFS (+ BADGE_BY_KEY)
├── config/challenges.ts                          ＋ CHALLENGE_TEMPLATES (Daily/Weekly/Monthly/Phase)
├── models/Achievement.ts · Badge.ts              ＋ collections + unique {userId,key} guards
├── models/Challenge.ts · Celebration.ts          ＋ collections + indexes
├── gamification/
│   ├── services/progressionRules.service.ts      ＋ THE Sprint-2 orchestrator (bus subscriber #2)
│   ├── services/achievement.service.ts           ＋ evaluate → track → unlock (+ bonus XP, badge, celebration)
│   ├── services/badge.service.ts                 ＋ metric + linked-badge unlock
│   ├── services/challenge.service.ts             ＋ generate → advance → complete → reset
│   ├── services/celebration.service.ts           ＋ celebration events + Activity mirror
│   ├── services/ruleContext.service.ts           ＋ builds the shared RuleContext (1 aggregation/event)
│   ├── services/gamificationProfile.service.ts   ＋ unified /profile read model
│   ├── services/rewardEngine.service.ts          ~ extracted commit(); + awardBonus() shared XP path
│   ├── repositories/{achievement,badge,challenge,celebration}.repository.ts  ＋ DB owners
│   ├── controllers/achievement.controller.ts     ＋ achievements/badges/challenges/celebrations/profile
│   ├── validators/achievement.validator.ts       ＋ query + challenge-action (zod)
│   ├── dto/gamification.dto.ts                    ~ + Achievement/Badge/Challenge/Celebration/Profile DTOs
│   ├── repositories/rewardHistory.repository.ts  ~ + countsBySource / titlesBySource (rule inputs)
│   ├── routes/gamification.routes.ts             ~ + 8 Sprint-2 routes
│   └── index.ts                                  ~ initGamification() now wires BOTH engines (ordered)
├── types/domain.ts                               ~ +5 activity types · 3 entity types · rarity/challenge/celebration enums
├── seed/gamification.ts · seed/seed.ts           ~ seedGamification() now drives the FULL pipeline (bus dispatch)
└── tests/achievements.smoke.ts                   ＋ 24-check end-to-end (npm run test:achievements)

frontend/src/
├── lib/gamification.ts                           ~ + RARITY_META · CHALLENGE_TYPE_META · time-remaining fmt
├── api/gamification.api.ts · hooks/useGamification.ts  ~ + profile/achievements/badges/challenges/celebrations
├── store/slices/gamificationSlice.ts             ~ + achievement filters · challenge filter · celebration queue
├── components/gamification/ (15 new)             ＋ cards, grids, progress bars, celebration modal/toast/provider
├── components/dashboard/GamificationDashboardCard.tsx  ＋ Home widget (self-fetches /profile)
├── pages/ (6 new)                                ＋ GamificationDashboard · Achievements · Badges · Challenges · Profile · CelebrationCenter
├── components/layout/AppLayout.tsx               ~ mounts <CelebrationProvider/>
├── components/layout/Sidebar.tsx                 ~ + Gamification & Achievements nav
├── router/index.tsx                              ~ + 6 routes
└── pages/DashboardPage.tsx                       ~ "Achievements & Challenges" Home section
```

**No previous module was rewritten.** The only shared change is additive: the
Reward Engine gained an `awardBonus` seam (Sprint 1 behaviour unchanged).

---

## 2. Progression Rules Engine Architecture

Two subscribers on ONE Activity bus, in a deliberate order:

```
                      activityService.record(...)
                               │  ActivityEvent
                               ▼
                    ┌─────────────────────┐
                    │   Activity Bus       │  (core, feature-agnostic)
                    └─────────────────────┘
                        │ (sequential, awaited, in registration order)
        ┌───────────────┴───────────────────────────┐
        ▼ (1)                                        ▼ (2)
 ┌──────────────┐                        ┌──────────────────────────┐
 │ Reward Engine │  XP·level·streak      │ ProgressionRulesEngine    │
 └──────────────┘                        │  challenge.advance()      │
        │ awardBonus() ◄──────────────── │  achievement.evaluate()   │
        │ (achievement/challenge XP)     │  badge.evaluate()         │
        ▼                                │  celebration.celebrate()  │
 UserProgression / RewardHistory         └──────────────────────────┘
```

Because the bus awaits subscribers **in registration order**, (1) always
finishes before (2) runs — so an XP-threshold achievement sees the XP the same
event just earned. Rule evaluation runs a **fixpoint loop** (max 3 passes): a
completed challenge or unlocked achievement can mint bonus XP that crosses the
next XP/level threshold, and the loop re-evaluates until it stops producing
unlocks (converges in ≤2 passes in practice).

**No reward logic is duplicated.** Bonus XP for achievements/challenges is minted
by `rewardEngine.awardBonus()`, which shares the exact `commit()` (atomic XP
`$inc` → derive level → advance streak → emit) with rule-based awards. Dedup uses
a synthetic `activityId` (`achievement:<key>`, `challenge:<id>`) against the same
unique index, so a bonus is granted exactly once.

**The loop-breaker (again).** The engines emit their own events (`xp-awarded`,
`achievement-unlocked`, `challenge-completed`, …). Those re-enter the bus but are
in `GAMIFICATION_ACTIVITY_TYPES`, so the Reward Engine skips them (no rule) and
the Rules Engine only turns `level-up`/`streak-increased` into celebrations —
never re-evaluates. The bus terminates.

---

## 3. Achievement Evaluation Strategy

Achievements are **data** (`config/achievements.ts`), each a `progress(ctx) →
number` over a shared, read-only `RuleContext`:

```ts
{ key, title, description, category, rarity, icon, maxProgress, bonusXP?, badgeKey?, progress(ctx) }
```

`RuleContext` is built once per event by `ruleContextService` — one progression
read + two small aggregations over `RewardHistory` (`countsBySource`,
`titlesBySource`) — and shared across every rule, so an event triggers **one**
context build, not N queries. Because RewardHistory is the Reward Engine's
already-deduped ledger, counts are exactly-once accurate.

Per event, for each definition: compute progress → `upsert` the row's progress +
denormalised fields → if `progress ≥ maxProgress`, atomically `unlockIfNeeded`
(matches `unlockedAt: null` → the duplicate-unlock guard). On a fresh unlock:
grant `bonusXP` via the Reward Engine, unlock any linked `badgeKey`, and raise a
celebration. Count rules (`10 Problems`), state rules (`1000 XP`, `Level 10`,
`30-Day Streak`) and keyword rules (`Graph Explorer` via earned problem titles)
all fit the one shape — new achievements are pure config.

---

## 4. Challenge Lifecycle

```
generate ──► advance ──► complete ──► reset (expire) ──► generate…
```

- **generate** — `ensureActive` (called on read) expires stale challenges then
  instantiates the current period's set from `CHALLENGE_TEMPLATES`. A unique
  `{userId, challengeKey, periodKey}` index makes generation idempotent
  (`periodKey` = day `2026-07-10` / week `W-…` / month `2026-07` / `phase-<id>`).
- **advance** — on each matching activity event the Rules Engine increments every
  Active, non-expired challenge whose `activityType` matches, capped at target.
- **complete** — on hitting the target: status `Completed`, `completedAt`, reward
  XP minted via the Reward Engine, optional `rewardBadge` unlocked, celebration
  raised. Exactly once (progress can only cross the target once).
- **reset** — `expireStale` flips past-deadline Active challenges to `Expired`;
  the next `ensureActive` regenerates the new period's set. Phase challenges track
  `LearningState.currentPhaseId` and regenerate when the phase changes.

`PATCH /challenges/:id` supports user actions — `refresh` (regenerate the set) and
`dismiss` (Expire one challenge).

---

## 5. Celebration Event Flow

```
unlock/complete/level-up ─► CelebrationService.celebrate()
                              ├─ Celebration doc (data only: type,title,icon,rarity,xp,seen)
                              └─ Activity mirror (achievement-unlocked / badge-earned / …)
                                    (level-up is NOT mirrored — Reward Engine already logged it)
Frontend: CelebrationProvider polls unseen ─► modal (major) | toast (minor) ─► POST /celebrations/seen
```

The backend stays UI-agnostic — a celebration carries only data, never animation
logic. The frontend `CelebrationProvider` baselines the historical backlog on
first load (so nothing spams), then surfaces only celebrations earned **while the
app is open**: a centre-stage `CelebrationModal` for major moments (level-up,
milestone, epic/legendary unlock) and a self-dismissing `AchievementToast` for
the rest, acknowledging each via `seen` so it never re-fires.

---

## 6. MongoDB Schemas

```
Achievement   userId · achievementKey · title · description · category · rarity ·
              icon · unlockedAt(null=locked) · progress · maxProgress · metadata · ts
              idx: {userId} {achievementKey} · UNIQUE {userId,achievementKey}

Badge         userId · badgeKey · title · description · category · icon · unlockedAt · ts
              idx: {userId} {badgeKey} · UNIQUE {userId,badgeKey}

Challenge     userId · challengeKey · title · description · challengeType · activityType ·
              targetValue · currentProgress · rewardXP · rewardBadge · status ·
              periodKey · expiresAt · completedAt · ts
              idx: {userId} {challengeType} {status} · UNIQUE {userId,challengeKey,periodKey}

Celebration   userId · type · title · description · icon · rarity · xp · metadata · seen · createdAt
              idx: {userId} {userId,createdAt:-1}
```

Every unlock/award is guarded by a UNIQUE index → duplicate achievements, badges
and per-period challenges are structurally impossible.

---

## 7. API Documentation

All `GET` unless noted, user-scoped (ownership enforced — every query keyed by
`userId`; no cross-user path).

| Endpoint | Returns |
|---|---|
| `GET /api/gamification/profile` | unified: progression + achievements(unlocked/total/recent/inProgress) + badges + active challenges + celebrations |
| `GET /api/gamification/achievements` | full catalogue w/ progress; filters `category`, `rarity`, `unlocked` |
| `GET /api/gamification/achievements/:id` | one achievement by key (locked or unlocked) |
| `GET /api/gamification/badges` | the user's badge collection |
| `GET /api/gamification/challenges` | `{ active, completed, byType }` (auto-ensures the current period) |
| `PATCH /api/gamification/challenges/:id` | `{ action: 'refresh' \| 'dismiss' }` |
| `GET /api/gamification/celebrations` | recent celebrations; `unseen`, `limit`; meta carries `unseen` count |
| `POST /api/gamification/celebrations/seen` | `{ ids?: string[] }` → acknowledge (all if omitted) |

Bad params → `400` with field-level messages (zod). Sprint 1's five endpoints are
unchanged.

---

## 8. Component Hierarchy

```
CelebrationProvider  (app-shell; polls → queue → modal|toast → mark-seen)
├── CelebrationModal        (major: level-up/milestone/epic+)
└── AchievementToast        (minor: badges, common unlocks, challenge complete)

GamificationOverview  (dashboard/profile composite)
├── ProgressProfileCard  → LevelProgressRing · XPProgressBar (Sprint 1 atoms)
├── RewardSummaryCard × n
├── MilestoneCard          (next in-progress achievement)
├── AchievementCard        (rarity glow · locked/unlocked · progress)
├── ChallengeCard          → ChallengeProgressBar + quick-resume link
└── CelebrationFeed

BadgeGrid → BadgeCard        ChallengeList → ChallengeCard

Pages: GamificationDashboard · Achievements · Badges · Challenges ·
       ProgressProfile · CelebrationCenter
Home widget: GamificationDashboardCard
```

**State split** (matches the app): React Query owns ALL server state
(`useGamificationProfile / useAchievements / useBadges / useChallenges /
useCelebrations`); Redux (`gamificationSlice`) holds **UI only** — achievement
filters/search/sort/view, the challenge filter, and the celebration queue + modal
visibility.

---

## 9. Gamification Dashboard (live-verified description)

*(App needs MongoDB to run; below is the real state from `npm run seed`.)*

- **`/gamification` hub** — the profile card (level ring, XP bar, achievement/
  badge/streak counts), a quick-link grid, headline stat tiles, the **next
  milestone** + **latest unlock**, an **active-challenges** row with quick-resume,
  and a **recent-celebrations** feed.
- **`/achievements`** — the full catalogue grid: rarity-glowing unlocked cards and
  dimmed locked cards with progress bars, plus category/rarity chips, unlocked/
  locked view toggle, search and sort.
- **`/badges`** — the collection grouped by category. **`/challenges`** — Daily/
  Weekly/Monthly/Phase groups with animated progress, time-remaining and reward,
  plus a completed section. **`/profile`** — recent unlocks, next milestones,
  badges and active challenges. **`/celebrations`** — the full highlight reel with
  type filter + mark-all-seen.
- **Home dashboard** — an "Achievements & Challenges" section (next milestone,
  active challenges, recent celebrations) alongside the Sprint 1 progression card.
- **Celebrations** — a level-up modal / achievement toast pops the moment an
  unlock happens while the app is open.

Seeded demo state (engine-produced, verified over live HTTP): **Level 5
(Apprentice), 2,155 XP, 12-day streak, 7/14 achievements** (Graph Explorer, Phase
Conqueror, Grinder, Getting Warmed Up, …), **2 badges** (Graph Guru, Phase
Conqueror), **7 active + 2 completed challenges**, **16 celebrations**.

---

## 10. Final Integration Summary — the complete Gamification Engine

Module 6 is a single event-driven pipeline hanging off the Activity bus:

```
                 Activity Event  (every module already records these)
                        │
        ┌───────────────┴───────────────┐
   Reward Engine                 ProgressionRulesEngine
   (Sprint 1)                    (Sprint 2)
   XP · Level · Streak           Achievements · Badges · Challenges · Celebrations
        └───────────────┬───────────────┘
                RewardHistory / UserProgression / Achievement / Badge / Challenge / Celebration
                        │
             /progression · /profile · /achievements · /badges · /challenges · /celebrations
                        │
        Home dashboard · Gamification hub · dedicated pages · live celebration toasts/modals
```

- **One rule surface**: XP rules (Sprint 1) and achievement/badge/challenge rules
  (Sprint 2) are all configuration; the engines are generic evaluators.
- **One XP minter**: the Reward Engine — rule awards and bonus awards share
  `commit()`; nothing else touches XP.
- **Exactly-once everywhere**: unique indexes on RewardHistory, Achievement,
  Badge and per-period Challenge make double-awards structurally impossible.
- **Fully event-driven & decoupled**: the core Activity system imports nothing
  from gamification; the feature self-registers two ordered subscribers.

**Prepared for the final module (AI Mentor) with no refactoring:** the AI Mentor
subscribes to the same Activity bus (or reads the profile) exactly as these
engines do; `metadata` fields on every collection carry AI context without
migration; the rule-config pattern (`ACHIEVEMENT_DEFS`, `CHALLENGE_TEMPLATES`) is
where AI-personalised goals/challenges plug in; and the celebration/activity feed
is a ready channel for mentor nudges.

---

## Verification

- `backend tsc` / `frontend tsc` → clean · `frontend vite build` → clean.
- `npm run test:achievements` → **24 checks pass** — achievement unlock + bonus XP
  + idempotency, badge unlock (metric + linked), challenge generate/advance/
  complete, phase challenge, 7-day streak milestone, celebration mark-seen,
  unified profile, no-recursion, ownership isolation.
- `npm run test:gamification` (Sprint 1, reward engine isolation) → **23 pass**;
  `npm run test:smoke` (full integration) → **all pass** (both engines subscribed).
- **Live end-to-end** (real mongod + seed + booted API): all 8 endpoints return
  correct data — profile composite, rarity-filtered achievements, badges, grouped
  challenges, `PATCH dismiss → Expired`, celebrations `unseen 16 → 0` after
  mark-seen.

## Success Criteria — met

Achievements unlock automatically via rules ✓ · badges awarded correctly ✓ ·
Daily/Weekly/Monthly/Phase challenges function ✓ · celebrations generated ✓ ·
dashboard displays gamification progress ✓ · components reusable ✓ · rule
evaluation centralised ✓ · modular & event-driven ✓ · Gamification Engine
production-ready ✓ · codebase prepared for the AI Mentor module without
refactoring ✓.
