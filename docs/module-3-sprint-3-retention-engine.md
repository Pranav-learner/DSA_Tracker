# Module 3 · Sprint 3 — Retention Engine, Confidence Decay & Mastery Synchronization

The intelligence layer on top of the Revision Engine. Every entity the learner
revises now carries a **RetentionProfile** that tracks **confidence**,
**retention** and **decay**, derives a dynamic **retention level**
(Learning → Familiar → Strong → Mastered → Needs Review → At Risk), and — for
topic-linked knowledge — **synchronises mastery** back into the Module 1 engine
(reused, never duplicated).

Flow implemented: `Revision Completed → Retention Updated → Confidence Updated →
Mastery Recalculated`, plus an **independent daily background job** that applies
confidence decay, flags overdue/at-risk knowledge and refreshes aggregates.

Explicitly **out of scope** (unchanged): AI-generated revision plans, predictive
scheduling, contest-performance analysis, adaptive learning algorithms. All
formulas are **configurable** (`config/retention.ts`) — nothing is hardcoded in
services or strategies.

---

## 1. Updated Folder Structure

`＋` new · `~` extended.

```
backend/src/
├── config/retention.ts                     ＋ thresholds · confidence · decay · weights · job (all tunable)
├── models/RetentionProfile.ts              ＋ per-entity retention state + snapshot history
├── repositories/retention.repository.ts    ＋ sole owner of RetentionProfile persistence
├── services/
│   ├── retention.service.ts                ＋ RetentionService — the intelligence layer
│   ├── confidence.service.ts               ＋ ConfidenceService — review boost + trend
│   ├── decayStrategy.ts                     ＋ DecayStrategy interface + DefaultDecayStrategy + registry
│   ├── retention.dto.ts                     ＋ profile / overview / confidence / dashboard DTOs
│   ├── revisionSession.service.ts          ~ .complete() → retentionService.syncAfterRevision (best-effort)
│   └── dashboard.service.ts / dashboard.dto.ts ~ + retention health widget (parallel call)
├── validators/retention.validator.ts       ＋ list / history query + confidence-override body
├── controllers/retention.controller.ts     ＋ retention + confidence endpoints
├── routes/retention.routes.ts + index.ts   ~ + /retention/*, /confidence
├── jobs/retentionDecay.job.ts              ＋ independent, non-blocking daily decay job
├── index.ts                                ~ start/stop the background job
├── types/domain.ts                         ~ retention levels, trends, decay strategy + activity types
├── seed/seed.ts                            ~ seedRetention() — spread of levels for the demo user
└── tests/roadmap.integration.ts            ~ retention sync + decay + overview + HTTP assertions

frontend/src/
├── api/retention.api.ts                    ＋
├── hooks/useRetention.ts                   ＋ profiles / overview / history / entity / confidence + override
├── store/slices/retentionSlice.ts          ＋ chart prefs + filters + time range (UI only)
├── lib/retention.ts                        ＋ level/trend meta, tones, score colours, next-review copy
├── components/retention/                   ＋ 11 components (see §6)
├── pages/RetentionPage.tsx                 ＋ Knowledge Retention hub (overview + filtered profiles)
├── pages/DashboardPage.tsx                 ~ + Knowledge Retention section (RetentionOverviewCard)
├── pages/TopicPage.tsx                     ~ + LearningHealthCard in the aside
├── pages/NotebookWorkspacePage.tsx         ~ + KnowledgeHealthCard in the aside
├── components/dashboard/ActivityTimeline.tsx ~ icons for the 5 new activity types
├── components/layout/Sidebar.tsx           ~ + Retention nav item
├── router/index.tsx                        ~ + /retention
└── types / queryClient                     ~ retention types & query keys
```

Reused (no duplication): `topicProgressService.applyUpdate` (feeds the
`confidence` mastery metric → `masteryService` recomputes overall mastery), the
Sprint-1 `revisionScheduleRepository` (next-review date), `notebookRepository`
(topic resolution), `activityService`, `DashboardMetricCard`, `CardContainer`,
`EmptyState`, `SectionHeader`, `MasteryRing`'s SVG language, and the whole
revision/mastery stack.

---

## 2. MongoDB Schema — RetentionProfile

One document per `(userId, entityType, entityId)`.

| Field | Type | Notes |
|---|---|---|
| `userId` | string | indexed |
| `entityType` | `topic \| pattern \| knowledgeEntry` | reuses the Sprint-1 entity types |
| `entityId` | string | e.g. topic id, `pattern:ps`, notebook id |
| `title` | string | denormalised for display |
| `topicId` | ObjectId \| null | link used for mastery sync |
| `confidenceScore` | number 0–100 | current confidence |
| `retentionScore` | number 0–100 | weighted blend (confidence + success − overdue penalty) |
| `decayScore` | number | current daily decay rate (points/day) |
| `currentLevel` | RetentionLevel | cached; always re-derived on read |
| `reviewCount` / `successfulReviews` / `missedReviews` / `overdueReviews` | number | counters |
| `averageReviewInterval` | number | rolling mean days between reviews |
| `lastReviewDate` / `nextReviewDate` / `lastDecayDate` | Date \| null | timing |
| `strategy` | string | decay strategy name (`default`) |
| `history` | `RetentionSnapshot[]` | capped at `RETENTION_HISTORY_LIMIT` (30) |
| `createdAt` / `updatedAt` | Date | timestamps |

`RetentionSnapshot = { confidenceScore, retentionScore, level, reason, date }`.

**Indexes:** unique `{ userId, entityType, entityId }`; `{ userId, nextReviewDate }`.

Levels, `daysUntilReview` and `isOverdue` are **derived at read time** — never
persisted stale.

---

## 3. API Documentation

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/retention` | All profiles (`?entityType=` filter) |
| GET | `/api/retention/overview` | Aggregates: avg confidence/retention, level counts, at-risk list, success rate, confidence trend |
| GET | `/api/retention/history` | Recent snapshots across all entities (`?limit=`) |
| GET | `/api/retention/:entityId` | One entity's full profile (404 if none) |
| PATCH | `/api/retention/:entityId` | Manual confidence override → recomputes retention + level |
| GET | `/api/confidence` | Confidence overview + per-entity confidence + trend |

All responses use the standard `{ success, data, meta? }` envelope. Validation:
confidence bounded 0–100 (bad values → 400), ownership scoped by `userId`,
unknown entity → 404. The retention block is also embedded in `GET /api/dashboard`.

---

## 4. Retention Engine Architecture

```
revisionSession.complete()
        │  (best-effort, never fails the completion)
        ▼
retentionService.syncAfterRevision(session)
   ├── ensureProfile()                       create-or-load
   ├── confidenceService.boostAfterReview()  configurable boost + self-rating blend
   ├── computeRetention()                    RETENTION_WEIGHTS · overdue penalty
   ├── deriveLevel()                         thresholds + timing → dynamic level
   ├── nextReviewDate ← revisionScheduleRepository (post-advance)
   ├── topicProgressService.applyUpdate({confidence})   ← MASTERY SYNC (reuse Module 1)
   ├── push snapshot (capped history)
   └── activity: retention-updated · confidence-increased · knowledge-strengthened
```

Services are thin and single-purpose:

- **ConfidenceService** — `boostAfterReview(current, selfRating)`,
  `trend(history)`. No storage, no hardcoded numbers.
- **DecayStrategy** — pluggable "forgetting curve". `DefaultDecayStrategy` uses a
  **review-damped** daily rate: `rate = base / (1 + reviewCount·damping)`,
  floored at `minDailyDecay`. Registered in a name → strategy registry so an
  AI/adaptive strategy can drop in later with **no schema change**.
- **RetentionService** — owns all business rules: sync, decay, level derivation,
  overview/confidence/history aggregation, manual override, dashboard summary.

Date math is delegated to the existing `revision.util.ts` (`daysUntil`, `dayKey`).

---

## 5. Retention Levels (dynamic)

Derived every read from `retentionScore` + review timing (config-driven):

| Level | Rule |
|---|---|
| **At Risk** | retention `< atRisk` (40) **or** overdue `> AT_RISK_OVERDUE_DAYS` (7) |
| **Needs Review** | past its `nextReviewDate` (overdue, but not At Risk) |
| **Mastered** | retention `≥ mastered` (90) |
| **Strong** | retention `≥ strong` (75) |
| **Familiar** | retention `≥ familiar` (50) |
| **Learning** | otherwise |

---

## 6. Component Hierarchy (11 components)

```
components/retention/
├── ConfidenceRing            animated SVG confidence dial (score-coloured)
├── RetentionLevelBadge       dynamic level badge (icon + variant per level)
├── RiskBadge                 renders only for Needs Review / At Risk
├── DecayIndicator            "-1.2/day · Moderate decay"
├── ConfidenceTrendChart      sparkline + rising/falling/stable header
├── ReviewSuccessCard         revision success-rate progress bar
├── RetentionSummary          6-tile metric grid (over an overview)
├── RetentionCard             one entity: rings + level + stats + trend + decay
├── RetentionOverviewCard     summary + trend + success + at-risk list (dashboard)
├── LearningHealthCard        Topic Workspace health block
└── KnowledgeHealthCard       Notebook health block
```

State split: **React Query** owns all retention/confidence/overview/history
server data (`useRetention.ts`); **Redux** (`retentionSlice`) holds only UI —
chart metric, time range, entity/level filters.

---

## 7. Integration Points

- **Revision completion** — `revisionSession.complete()` calls
  `syncAfterRevision` after the schedule advances; wrapped in try/catch so
  retention is strictly downstream and can never break a completion.
- **Mastery** — topic/knowledge reviews feed `confidence` into
  `topicProgressService.applyUpdate`, which recomputes overall mastery through
  `masteryService`. No mastery math is duplicated.
- **Dashboard** — `dashboardService.get()` adds a `retention` block via a
  parallel `getDashboardSummary` call (avg confidence/retention, at-risk, needs
  review, mastered, overdue, success rate, trend direction/delta).
- **Topic Workspace** — `LearningHealthCard` (confidence, retention level/score,
  trend, next review, health read).
- **Notebook Workspace** — `KnowledgeHealthCard` (confidence + retention history,
  review count, last/next review, knowledge health).
- **Activity feed** — 5 new events: `confidence-increased`,
  `confidence-decreased`, `retention-updated`, `knowledge-strengthened`,
  `knowledge-at-risk` (plus existing `mastery-updated`).

---

## 8. Background Retention Job

`jobs/retentionDecay.job.ts`, started in `index.ts`, stopped on shutdown.

- **Independent & non-blocking** — never in a request path, catches its own
  errors, `unref()`s its timer so it can't keep the process alive.
- Applies **daily confidence decay** via each profile's DecayStrategy, marks
  **overdue** reviews, recomputes **retention + level**, and logs fading
  confidence / at-risk transitions.
- **Idempotent per day** (skips profiles decayed `< 1` day ago via `lastDecayDate`).
- Cadence + on/off come from config/env (`RETENTION_JOB_INTERVAL_MS`,
  `RETENTION_JOB_ENABLED`); disabled cleanly under tests.

Mastery sync fires on **review completion only**, not on decay — keeping the
background pass lightweight.

---

## 9. Configuration (single source of truth)

`config/retention.ts` — every number the engine uses:

- `RETENTION_LEVEL_THRESHOLDS` (mastered 90 · strong 75 · familiar 50 · atRisk 40)
- `AT_RISK_OVERDUE_DAYS` (7)
- `CONFIDENCE_CONFIG` (reviewBoost 12 · selfWeight 0.5 · trendDelta 3 · default 50)
- `DECAY_CONFIG` (baseDailyDecay 2.0 · reviewDamping 0.35 · minDailyDecay 0.3)
- `RETENTION_WEIGHTS` (confidence 0.6 · success 0.4)
- `RETENTION_HISTORY_LIMIT` (30) · `RETENTION_JOB` (interval + enabled)

Retune the whole model here; strategies read these — no service edits needed.

---

## 10. Verification

- **Backend** `tsc --noEmit` → clean.
- **Frontend** `tsc --noEmit` + `vite build` → clean (pre-existing chunk-size /
  dynamic-import notes only).
- **Smoke** (`npm run test:smoke`, in-memory Mongo) → `✅ ALL ASSERTIONS PASSED`,
  including: auto-created profile on completion, counter/confidence boost,
  topic-linked **mastery sync**, manual override recompute, overview/confidence/
  history aggregates, background decay run, dashboard retention widget, and the 5
  activity events — plus HTTP `200/404/400` coverage for every route
  (`list=200 overview=200 history=200 entity=200 patch=200 confidence=200
  missing=404 badPatch=400`).
- **Seed** extends the demo user with a spread of retention profiles
  (Mastered → At Risk) so the dashboard, rings and trend charts are alive on
  first run.
