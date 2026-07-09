# Sprint 4 — Mentor Dashboard & Learning Experience

The Dashboard is now the learner's home screen. Opening CP-OS answers, at a glance:
*What should I study today? Where am I in the roadmap? How much progress have I made?
What is my current mastery? What should I do next? What phase/topic is active?*

Everything is driven by **real backend data** through a single aggregation endpoint
(`GET /api/dashboard`). **No new learning algorithms were introduced** — the sprint
composes the existing Sprint 1–3 services and adds a lightweight Activity feed.

---

## 1. Updated Folder Structure

New files are marked `＋`. Nothing existing was rewritten except `DashboardPage.tsx`
(reassembled) and small additive edits (route registry, invalidation, seed, domain enums).

```
backend/src/
├── models/
│   └── Activity.ts                    ＋ recent-learning-event log (NOT analytics)
├── repositories/
│   ├── activity.repository.ts         ＋ Activity Mongo ops (findRecent / create / insertMany)
│   └── topic.repository.ts            ~ + findByIds(), estimatedHoursByPhase()
├── services/
│   ├── activity.service.ts            ＋ getRecent() + record() + ActivityDTO
│   ├── dashboard.dto.ts               ＋ DashboardDTO + roadmap/phase summary shapes
│   ├── dashboard.service.ts           ＋ ORCHESTRATION-ONLY aggregator
│   └── topicProgress.service.ts       ~ records an activity event on status transitions
├── controllers/
│   └── dashboard.controller.ts        ＋ GET /api/dashboard
├── routes/
│   ├── dashboard.routes.ts            ＋
│   └── index.ts                       ~ mounts /dashboard + endpoint doc
├── seed/
│   ├── activity.ts                    ＋ DEMO_ACTIVITY story data
│   └── seed.ts                        ~ seedDemoActivity()
├── types/domain.ts                    ~ ACTIVITY_TYPES / ACTIVITY_ENTITY_TYPES enums
└── tests/roadmap.integration.ts       ~ dashboard + activity assertions

frontend/src/
├── api/dashboard.api.ts               ＋ dashboardApi.get()
├── hooks/useDashboard.ts              ＋ React Query hook
├── components/dashboard/              ＋ the reusable dashboard set
│   ├── HeroCard.tsx
│   ├── TodaysLearningCard.tsx
│   ├── CurrentTopicCard.tsx
│   ├── ProgressSummaryCard.tsx
│   ├── PhaseProgressCard.tsx
│   ├── RoadmapMiniView.tsx            (memoized)
│   ├── LearningInsightCard.tsx
│   ├── ActivityTimeline.tsx           (memoized + default export → lazy chunk)
│   ├── DashboardMetricCard.tsx
│   ├── DashboardSection.tsx
│   ├── DashboardGrid.tsx
│   ├── QuickActionButton.tsx
│   └── index.ts                       (barrel; ActivityTimeline excluded for code-split)
├── pages/DashboardPage.tsx            ~ reassembled: hero + main + right insights panel
├── lib/
│   ├── utils.ts                       ~ greeting(), formatHours(), relativeTime()
│   ├── mastery.ts                     ~ LADDER_STAGE_ORDER
│   └── queryClient.ts                 ~ queryKeys.dashboard
├── hooks/useLearning.ts               ~ invalidates dashboard on mutations
└── types/index.ts                     ~ Dashboard / ActivityEvent / RoadmapSummaryPhase…
```

---

## 2. Dashboard Architecture

The dashboard follows the existing layered doctrine exactly:

```
route → controller → DashboardService (orchestration) → existing services → repositories → models
```

`DashboardService` holds **zero business rules**. It is a pure composition layer that
reuses the Learning Engine as-is:

| Concern              | Source (reused, unchanged)                                  |
|----------------------|-------------------------------------------------------------|
| Overall progress     | `progressService.getOverview()` (the single heavy call)     |
| Recommendation       | `recommendationService.build(overview)` — pure, no DB       |
| Current phase/topic  | `topicRepository.findByIds()` + `phaseService.list()` refs  |
| Roadmap summary      | derived from `overview.phases` + phase metadata             |
| Phase time remaining | `topicRepository.estimatedHoursByPhase()` − spent (weighted) |
| Recent activity      | `activityService.getRecent()`                               |

This mirrors how `learningState.service` already composes `getOverview` +
`recommendation.build` — so the expensive roadmap load happens **once**, and everything
else is derived or a small parallel query. The client makes **one** request instead of
the previous three (`/learning/state` + `/progress` + `/roadmap`).

On the frontend, **server state stays in React Query** (`useDashboard`), **UI state stays
in Redux** (no `dashboardSlice` was needed). The dashboard renders as a hero + two-column
body (main content + right insights panel) inside the existing `AppLayout` shell.

---

## 3. Dashboard Aggregation Flow

```
GET /api/dashboard
      │
      ▼
dashboardController.getDashboard  (currentUserId → service)
      │
      ▼
dashboardService.get(userId)
      │
      ├─ 1. overview      = progressService.getOverview(userId)   ← ONE heavy load
      ├─ 2. recommendation = recommendationService.build(overview) ← pure, reuses overview
      ├─ 3. parallel:  phaseService.list()
      │                topicRepository.estimatedHoursByPhase()
      │                activityService.getRecent(userId, 8)
      ├─ 4. topicRepository.findByIds([currentTopicId, recommendation.topicId])  ← 1 query
      └─ 5. assemble DashboardDTO
            • currentPhase / currentTopic / currentStage / currentMastery
            • overall (topics, phases, mastery, confidence)
            • recommendation + recommendedTopic
            • currentPhaseProgress (+ estimatedTimeRemainingHours)
            • roadmap[]  (each phase → completed | current | unlocked | locked)
            • recentActivity[]
      │
      ▼
{ success: true, data: DashboardDTO }
```

Query budget: `getOverview` (1 combined phase+topic+progress load) + 3 parallel light
reads + 1 batched topic lookup. No duplicated business logic; no per-item N+1.

---

## 4. API Documentation

### `GET /api/dashboard`

Aggregated learner home screen for the current user. Auth is single-user for now
(`currentUserId` → `env.demoUserId`); becomes per-user with no controller change.

**Response** `200` — `{ success: true, data: Dashboard }`

```ts
interface Dashboard {
  userId: string;
  currentPhase: PhaseRef | null;          // { id, title, order, slug, color, icon }
  currentTopic: TopicSummary | null;      // active topic ref (name, difficulty, hours…)
  currentStage: LadderStage | null;       // pattern-ladder stage the learner is on
  currentMastery: number;                 // 0–100 mastery of the current topic
  overall: OverallProgress;               // topics/phases counts, %, mastery, confidence
  recommendation: Recommendation;         // rule-based next best action
  recommendedTopic: TopicSummary | null;  // topic the recommendation points at
  currentPhaseProgress: {                 // null if no active phase
    ...PhaseProgress;                     // completion %, topicsCompleted/Total, mastery
    phase: PhaseRef;
    estimatedTotalHours: number;
    estimatedTimeRemainingHours: number;
  } | null;
  roadmap: {                              // compact all-phases widget
    phaseId; title; slug; order; color; icon;
    state: 'completed' | 'current' | 'unlocked' | 'locked';
    completionPercent; topicsCompleted; topicsTotal; mastery;
  }[];
  recentActivity: {                       // newest-first
    id; type; entityType; entityId; title; description; createdAt;
  }[];
}
```

Error envelope is the standard `{ success: false, error: { message, statusCode } }`.
Every sub-shape reuses the existing Sprint 1–3 DTOs — the frontend contract is stable.

---

## 5. Activity Model

A **lightweight event log** for the timeline — deliberately **not** analytics. It records
discrete learning events only, keyed by user, newest-first.

```ts
// models/Activity.ts
interface IActivity {
  userId: string;
  type: ActivityType;             // topic-started | topic-completed | topic-mastered |
                                  // topic-unlocked | mastery-updated | phase-unlocked | phase-completed
  entityType: 'topic' | 'phase';  // generic on purpose → future modules extend it
  entityId: string | null;
  title: string;
  description: string;
  createdAt: Date;                // indexed { userId, createdAt: -1 }
}
```

**How events are produced**

- **Live:** `topicProgressService.applyUpdate` records the single most-significant event
  on a status transition (started / completed / mastered / progress-updated). Logging is
  best-effort (`activityService.record` swallows failures) so it can never break a study
  update.
- **Seeded:** `seedDemoActivity()` back-dates a realistic feed so the timeline feels alive
  on first run (mirrors the demo story: Phase 0 mastered → currently on Sliding Window).

`activityService` exposes `getRecent(userId, limit)` (read) and `record(userId, input)` —
the latter is the **reuse hook** for future modules (problems, revision, contests).

---

## 6. Component Hierarchy

```
DashboardPage  (useDashboard → one query)
├── HeroCard ........................ greeting · phase · topic · stage · overall mastery ring
│                                     · Continue button · topics remaining        [focal point]
├── main column (xl:col-span-2)
│   ├── DashboardSection "Today's Learning"
│   │   ├── CurrentTopicCard ........ mastery ring · stage · ladder position · est. time · Open
│   │   └── TodaysLearningCard ...... recommended topic · reason · time · difficulty · Continue
│   ├── DashboardSection "Learning Progress"
│   │   └── ProgressSummaryCard ..... completion bar + DashboardGrid of DashboardMetricCard×6
│   ├── DashboardSection "Current Phase"
│   │   └── PhaseProgressCard ....... completion % · done/remaining · time left · progress bar
│   ├── DashboardSection "Roadmap"
│   │   └── RoadmapMiniView ......... all phases → completed/current/unlocked/locked → /roadmap
│   └── DashboardSection "Recent Learning Activity"
│       └── <Suspense> ActivityTimeline (lazy) ... started/completed/unlocked/mastery events
└── right insights panel (aside)
    ├── DashboardSection "Learning Insights"
    │   ├── LearningRecommendationCard  (reused from Sprint 3)
    │   └── LearningInsightCard ×4 ...... mastery · confidence · stage · topics remaining
    └── DashboardSection "Learning Summary"
        ├── LearningInsightCard ×3 ...... completed · phases · streak (placeholder)
        └── UpcomingFeatures ............ Module 2+ teasers (locked)
```

Layout primitives — `DashboardSection`, `DashboardGrid`, `DashboardMetricCard`,
`QuickActionButton` — plus reused building blocks (`CardContainer`, `MasteryRing`,
`MasteryBar`, `Badge`, `DifficultyBadge`, `EmptyState`, `ErrorState`, `Icon`). All new
components are reusable and design-system aligned (glass `bg-card/60 backdrop-blur`,
`shadow-card`/`shadow-glow`, rounded `--radius`, framer entrance/hover, tone helpers).

---

## 7. Dashboard Screens (described)

- **Hero** — gradient glass card with an ambient primary glow, greeting eyebrow, the
  current topic as a large headline, phase/stage/difficulty badges, a `Continue Learning`
  button, "N topics remaining", and a 120px overall-mastery ring with "X% complete".
- **Today's Learning** — two cards side by side: the active topic (ring + stage + ladder
  position + est. time + Open Topic) and the recommendation (topic, reason, est. study
  time, difficulty, Continue). Falls back to *"No recommendation available."*
- **Learning Progress** — a completion bar over a 3-column grid of metric tiles
  (completed, remaining, phases done, avg mastery, avg confidence, overall mastery),
  each tone-coloured by value.
- **Current Phase** — phase icon in its brand colour, completion %, done/remaining topics,
  estimated time left, and a progress bar.
- **Roadmap widget** — a compact list of all 11 phases with coloured state chips; clicking
  a phase opens it in the full Roadmap.
- **Recent Activity** — a vertical timeline with per-type icons/tones and relative times.
- **Right panel** — reused recommendation card + insight rows (mastery, confidence, stage,
  remaining), a learning summary (completed, phases, streak placeholder), and upcoming
  features.
- **States** — full-page skeleton while loading, `ErrorState` with retry on failure,
  and graceful empty states (no active topic / phase / activity).

Responsive: right panel drops below the main column under `xl`; the "Today's Learning"
pair stacks under `md`; metric/roadmap grids collapse to one column on mobile.

---

## 8. Performance Considerations

- **One request** replaces three (`/learning/state` + `/progress` + `/roadmap`) — the
  server aggregates and the heavy `getOverview` runs once per request.
- **Parallel queries** — phase list, per-phase hours and recent activity run concurrently;
  current/recommended topics resolve in a single batched `findByIds`.
- **React Query** owns caching (`staleTime` 60s), dedupes, and threads `AbortSignal`;
  mutations invalidate `queryKeys.dashboard` so the hero/timeline stay live.
- **Code-splitting** — `ActivityTimeline` (below the fold) is `React.lazy`-loaded into its
  own chunk (~2 kB) behind `<Suspense>`; excluded from the barrel so the split is real.
- **Memoization** — `ActivityTimeline` and `RoadmapMiniView` are `React.memo`'d to skip
  re-renders when unrelated UI state (e.g. the mobile drawer) changes.
- **No Redux server state** — nothing server-derived enters the store; no needless slices.

---

## 9. Extension Points for Module 2

- **Activity is the shared event bus.** `activityService.record(userId, { type, entityType,
  entityId, title, description })` is generic by design — the Problem Tracker, Revision
  Scheduler and Contest modules append their own events (add types to `ACTIVITY_TYPES`,
  entity kinds to `ACTIVITY_ENTITY_TYPES`) and they appear on the timeline with no
  dashboard changes.
- **DashboardService is a pure composition seam.** New home-screen widgets (streaks,
  due-revisions, contest countdowns) are added by composing a new service into
  `dashboardService.get` and extending `DashboardDTO` — no business logic moves into it.
- **Reusable component set.** `DashboardSection` / `DashboardGrid` / `DashboardMetricCard`
  / `LearningInsightCard` / `QuickActionButton` / `ActivityTimeline` are module-agnostic
  and ready to host Module 2 panels.
- **Placeholders already wired.** Learning Streak and the Upcoming Features list mark where
  gamification and future modules slot in.
- **Single-user → multi-user** remains a `currentUserId` change only; every layer already
  threads `userId`.

> Out of scope (future modules, intentionally not built): problem tracking, revision
> scheduling, analytics dashboards, contests, gamification, AI mentor.
