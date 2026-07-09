# Module 3 · Sprint 4 — Revision Experience Integration & Learning Dashboard

The capstone integration sprint. Every engine built so far — **Learning**
(Module 1), **Knowledge** (Module 2), **Revision** + **Retention** (Module 3
Sprints 1–3) — is unified behind a single **Learning Operating System**
dashboard. One `GET /api/dashboard` call answers the five questions the learner
cares about:

> **What to learn · What to revise · What's being forgotten · What's improving ·
> What to prioritise today.**

This is an **orchestration + UX** sprint: no new domain rules were added to the
engines. The only new logic is the small *composite* derivation (health scoring,
today's-plan priority) that spans engines — and it lives in a dedicated domain
service, never in the aggregation layer, controllers, or the frontend.

Out of scope (later modules): advanced analytics, AI coaching, predictive
models, contest analytics, knowledge-graph visualisation.

---

## 1. Updated Folder Structure

`＋` new · `~` extended.

```
backend/src/
├── config/health.ts                         ＋ health thresholds + weights (configurable)
├── repositories/notebook.repository.ts      ~ knowledgeStats() single-pipeline rollup
├── services/
│   ├── notebook.service.ts / notebook.dto.ts ~ stats() → KnowledgeStatsDTO (Module 2 owned)
│   ├── dashboardInsights.service.ts          ＋ DERIVATION: health · today-plan · quick-actions · knowledge
│   ├── dashboard.service.ts                  ~ orchestration only — fetch + wire (the AggregationService)
│   └── dashboard.dto.ts                       ~ + knowledge / today-plan / health / quick-action DTOs
└── tests/roadmap.integration.ts              ~ Sprint-4 dashboard-OS assertions

frontend/src/
├── lib/health.ts                            ＋ status/priority meta + bar colours
├── components/dashboard/                      ＋ 8 integration components (see §4)
│   └── HeroCard.tsx                          ~ + overall retention + secondary (Start Revision) action
├── pages/DashboardPage.tsx                   ~ rebuilt as the Learning-OS hub
└── types/index.ts                            ~ + DashboardKnowledge/TodayPlan/Health/QuickAction
```

**Reused, not rebuilt** (this is the point of the sprint): `progressService`,
`recommendationService`, `phaseService`, `activityService`, `revisionQueueService`,
`revisionSessionService`, `retentionService`, `notebookService`, and — on the
frontend — `HeroCard`, `TodaysLearningCard`, `CurrentTopicCard`, `RoadmapMiniView`,
`ActivityTimeline` (the Activity Feed), `DashboardSection` (Section Container),
`DashboardGrid`, `DashboardMetricCard` (Metric Overview Card), `QuickActionButton`,
`MasteryBar`, `ScheduleChip`, and the retention `ConfidenceTrendChart` tones.

---

## 2. Dashboard Aggregation Architecture

Two layers, cleanly split:

```
GET /api/dashboard
        ▼
dashboardService.get(userId)          ← ORCHESTRATION ONLY (the DashboardAggregationService)
   1. progressService.getOverview()               ┐ one heavy read
   2. recommendationService.build(overview)       │ pure
   3. Promise.all([                                │ everything else in parallel:
        phaseService.list(),                       │   Learning
        topicRepository.estimatedHoursByPhase(),   │
        activityService.getRecent(),               │   Activity
        revisionQueueService.getDashboardSummary(),│   Revision (queue)
        revisionSessionService.getDashboardSummary,│   Revision (session)
        retentionService.getDashboardSummary(),    │   Retention
        notebookService.stats(),                   │   Knowledge
      ])                                           ┘
        ▼ (hand the summaries to the derivation layer)
dashboardInsightsService              ← DERIVATION (composite rules, config-driven)
   • buildKnowledge(stats, topicsTotal)      → coverage %, patterns pending
   • buildTodayPlan({rec, topic, mastery, queue}) → priority, study/revision minutes
   • buildHealth({overall, knowledge, queue, retention}) → 4 indicators + overall score
   • buildQuickActions({rec, topicId, activeSession, due}) → routed actions
        ▼
DashboardDTO  (single payload)
```

- **`dashboardService`** holds **zero business rules** — it fetches and wires.
  It *is* the DashboardAggregationService the brief asks for.
- **`dashboardInsightsService`** owns the only new logic: health scoring and
  plan priority. These are cross-engine composites that belong to no single
  engine, so they get their own domain service (pure functions over DTOs). All
  thresholds/weights come from `config/health.ts` — nothing hardcoded.
- Only **one new query** was added (`notebookService.stats`, a single MongoDB
  aggregation). Health reuses the retention/revision/overview data already
  fetched — no redundant round-trips.

---

## 3. API Documentation

`GET /api/dashboard` → `{ success, data: DashboardDTO }`. New blocks this sprint:

| Field | Source | Contents |
|---|---|---|
| `todayPlan` | recommendation + revision queue + current topic | `recommendation`, `currentTopic`, `revisionsDue`, `estimatedStudyMinutes`, `estimatedRevisionMinutes`, `priority`, `headline` |
| `health` | overall + knowledge + revision + retention | `overallScore/Status`, `indicators[4]` (learning·knowledge·revision·retention, each `score`+`status`+`detail`), `confidence`, `topicsAtRisk`, `masteredTopics`, `upcomingReviews` |
| `knowledge` | notebook rollup | `knowledgeEntries`, `representativeProblems`, `patternsLearned`, `patternsPending`, `topicsCovered`, `notebookCoveragePercent` |
| `quickActions` | current state | array of `{ kind, label, to, enabled, primary }` into existing routes |

Existing blocks unchanged: `currentPhase/Topic/Stage/Mastery`, `overall`,
`recommendation`, `recommendedTopic`, `currentPhaseProgress`, `roadmap`,
`recentActivity`, `revision`, `retention`. No new endpoints — the whole home
screen is still **one request**.

---

## 4. Component Hierarchy

```
DashboardPage
├── HeroCard ~                     greeting · phase · topic · rec · mastery + retention · Continue/Start Revision
├── main column
│   ├── DashboardSection "Today's Plan"
│   │   ├── LearningPlanCard ＋     headline · priority · study/revision time · actions
│   │   ├── CurrentTopicCard
│   │   └── TodaysLearningCard
│   ├── DashboardSection "Today's Revision" → RevisionSummaryCard ＋  queue counts · up-next · resume
│   ├── DashboardSection "Learning Health"  → LearningHealthCard ＋   4× HealthIndicator ＋ + figures
│   ├── DashboardSection "Progress"         → ProgressOverviewCard ＋ completion · mastery · confidence · retention
│   ├── DashboardSection "Knowledge Retention" → RetentionSummaryCard ＋ trend + metrics
│   ├── DashboardSection "Knowledge Summary"   → KnowledgeSummaryCard ＋ coverage + counts
│   ├── DashboardSection "Roadmap"          → RoadmapMiniView
│   └── DashboardSection "Recent Activity"  → ActivityTimeline (lazy) = the Activity Feed
└── aside (sticky)
    ├── DashboardSection "Quick Actions"    → QuickActionsPanel ＋
    └── DashboardSection "Phase"            → PhaseGlance
```

Every listed brief-component maps to a real one (reused where it already
existed): DashboardHero→`HeroCard`, MetricOverviewCard→`DashboardMetricCard`,
SectionContainer→`DashboardSection`, ActivityFeed→`ActivityTimeline`,
DashboardGrid→`DashboardGrid`. No duplicated UI.

---

## 5. Dashboard Loading Strategy

- **One request, parallel fan-out.** The page issues a single `useDashboard()`
  query; the backend fans out to every engine with `Promise.all`, so wall-clock
  ≈ the slowest single summary, not their sum.
- **Full-page skeleton** mirrors the final layout (no content-shift on load).
- **Lazy activity feed.** `ActivityTimeline` is `React.lazy` + `Suspense` —
  below-the-fold, code-split out of the initial bundle.
- **Sticky insight rail** (`xl:sticky top-24`) keeps Quick Actions in view while
  the main column scrolls.

---

## 6. Performance Optimisations

- **No over-fetching** — the dashboard is a single query; the Sprint-3 dashboard
  even *dropped* its extra `useRetentionOverview` call, now served from the
  aggregated payload (`RetentionSummaryCard`).
- **One added DB round-trip** (`knowledgeStats`), a single `$group` aggregation
  rather than loading entries.
- **React Query** owns all server state with `staleTime` (see `queryClient`);
  navigation back to the dashboard is instant from cache and revalidates in the
  background.
- **Memo-friendly components** — every card is a pure function of its props;
  values are backend-computed so the client never recalculates on render.
- **Redux holds UI state only** (panel/layout prefs, filters); server data never
  enters the store.

---

## 7. Updated Activity Flow

The Activity Feed (`ActivityTimeline`) already renders **newest-first** and, from
Sprint 3, understands the full event vocabulary the brief asks for:

`topic-completed · problem-solved · notebook-updated · revision-completed ·
retention-updated · confidence-increased / -decreased · knowledge-strengthened /
-at-risk · mastery-updated · …`

Completing a revision still triggers the Sprint-3 chain
(`retention → confidence → mastery`), each step emitting its event; the dashboard
query invalidates on those mutations so the feed and health panel stay in sync
with no manual refresh.

---

## 8. The Completed Dashboard (description)

A single dark, Linear-inspired screen:

- **Hero** — greeting, current phase/topic/stage badges, an overall-mastery ring
  with a retention read beside it, and two CTAs: **Continue Learning** +
  **Start Revision**.
- **Today's Plan** — a priority-tagged headline ("Catch up on 2 overdue reviews,
  then continue…"), study/revision time estimates, and inline actions; flanked
  by the current-topic and recommended-topic cards.
- **Today's Revision** — Due/Overdue/Upcoming/Done tiles, an "Up Next" preview
  with entity chips + countdowns, and an active-session resume banner.
- **Learning Health** — four status-coloured indicator bars (Learning ·
  Knowledge · Revision · Retention) + an overall score badge, over headline
  figures (confidence, at-risk, mastered, upcoming).
- **Progress / Retention / Knowledge** — metric grids for completion, mastery,
  confidence, retention, notebook coverage and patterns learned vs pending.
- **Roadmap** mini-view + lazy **Activity** feed.
- **Right rail** — a Quick Actions panel (disabled actions dimmed, not hidden)
  and a compact current-phase glance, sticky on desktop.

Responsive: single-column on mobile with the same cards stacking; the rail drops
below the main column; grids collapse via `DashboardGrid`. Health bars expose
`role="progressbar"` + aria values; actions are keyboard-focusable links.

---

## 9. Architecture Decisions

1. **Enrich `dashboardService`, don't rename it.** It was already pure
   orchestration, so it *is* the DashboardAggregationService — a rename would be
   churn for no gain. Documented as such.
2. **Composite logic → a new domain service, not the aggregator.** Health/plan
   scoring spans engines and belongs to none, so `dashboardInsightsService`
   holds it. This keeps the aggregation layer logic-free and the frontend a pure
   view — satisfying "no business logic in controllers/frontend".
3. **Config over constants.** `config/health.ts` mirrors the retention/revision
   config pattern so the health model is tunable in one place.
4. **Reuse the aggregated payload on the client.** Retention summary now reads
   from the dashboard DTO instead of a second query — fewer requests, always
   consistent.
5. **One query, parallel fan-out** stays the contract — the home screen never
   makes N calls.

---

## 10. Extension Points for Module 4 (Analytics Engine)

- **`dashboardInsightsService`** is the natural home for richer derived metrics
  (trends, velocity, forecasts) — add builders without touching the aggregator.
- **`config/health.ts`** lets Analytics retune or A/B the health model centrally.
- **`notebook.repository.knowledgeStats`** established the single-pipeline stats
  pattern Analytics can extend (per-phase, per-time-window rollups).
- **`DashboardDTO`** is additive-by-composition — new blocks append with no
  breaking change; the frontend renders what's present.
- **Activity vocabulary + retention snapshots** already persist the time-series
  Analytics will chart; no schema change needed to start.
- The **health score** is the seed metric a future Analytics "learning score
  over time" chart can accumulate.

---

## Verification

- **Backend** `tsc --noEmit` → clean.
- **Frontend** `tsc --noEmit` + `vite build` → clean (pre-existing chunk-size /
  dynamic-import notes only).
- **Smoke** (`npm run test:smoke`) → `✅ ALL ASSERTIONS PASSED`, incl. new
  dashboard-OS assertions: knowledge summary, today's plan (priority + minutes),
  4-indicator health panel with valid scores/status, and ≥6 quick actions all
  routed to existing paths — e.g.
  `knowledge{entries=2 coverage=3%} plan{priority=medium study=50m}
  health{overall=56/fair indicators=4} actions=7`.
