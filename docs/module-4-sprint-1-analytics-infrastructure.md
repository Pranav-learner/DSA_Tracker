# Module 4 · Sprint 1 — Analytics Infrastructure & Aggregation Engine

The backend foundation every future analytics feature consumes. A self-contained
`analytics/` module collects data from all prior engines through a single
**Analytics Aggregation Layer** and exposes unified, chart-agnostic APIs. No
charts, dashboards, reports or AI insights are built here — this is
infrastructure.

Core rule honoured: **analytics never queries individual modules from a
controller**. Everything flows controller → aggregation service → domain
analytics services → existing services/repositories → MongoDB.

```
Learning · Knowledge · Attempt · Revision · Retention · Activity
                          ▼
             Analytics Aggregation Layer   ← this sprint
                          ▼
                 Unified analytics APIs
                          ▼
              (Sprint 2: charts & insights)
```

---

## 1. Updated Folder Structure

`＋` new · `~` extended.

```
backend/src/
├── config/analytics.ts                      ＋ cache TTLs · job cadence · date ranges · windows
├── analytics/                               ＋ SELF-CONTAINED module
│   ├── types/analytics.types.ts             ＋ AnalyticsWindow · AnalyticsContext · scopes
│   ├── dto/analytics.dto.ts                 ＋ Learning/Problem/Knowledge/Revision/Retention/Activity + Overview DTOs
│   ├── repositories/analytics.repository.ts ＋ NEW cross-collection aggregation pipelines (read-only)
│   ├── services/
│   │   ├── metricsEngine.ts                 ＋ reusable metric math (percentage, rate, average, velocity, growth…)
│   │   ├── learningAnalytics.service.ts     ＋ reuses ProgressService
│   │   ├── problemAnalytics.service.ts      ＋ reuses ProblemRepository + aggregation
│   │   ├── knowledgeAnalytics.service.ts    ＋ reuses NotebookService
│   │   ├── revisionAnalytics.service.ts     ＋ reuses RevisionQueueService
│   │   ├── retentionAnalytics.service.ts    ＋ reuses RetentionService
│   │   ├── activityAnalytics.service.ts     ＋ buckets + streaks
│   │   ├── analyticsAggregation.service.ts  ＋ orchestrator + caching (the single entry point)
│   │   └── analyticsCache.service.ts        ＋ in-memory TTL + activity-token invalidation
│   ├── validators/analytics.validator.ts    ＋ range / date-window resolution + validation
│   ├── controllers/analytics.controller.ts  ＋ 7 handlers (no business logic)
│   ├── routes/analytics.routes.ts           ＋ /api/analytics/*
│   └── utils/analyticsResponse.ts           ＋ status/message/timestamp/data/metadata envelope
├── jobs/analyticsRefresh.job.ts             ＋ independent, non-blocking cache pre-warm
├── routes/index.ts                          ~ mount /api/analytics
├── index.ts                                 ~ start/stop the analytics job
└── tests/roadmap.integration.ts             ~ analytics service + HTTP assertions

frontend/src/
├── lib/analytics.ts                         ＋ range presets · tones · delta fmt
├── api/analytics.api.ts                     ＋ overview + 6 scopes
├── hooks/useAnalytics.ts                    ＋ React Query hooks (reads shared range state)
├── store/slices/analyticsSlice.ts           ＋ UI state (range · comparison · view · filters)
├── components/analytics/                     ＋ 12 reusable components (see §9)
├── pages/                                    ＋ AnalyticsHome + 6 scope pages
├── router/index.tsx · layout/Sidebar.tsx     ~ /analytics routes + nav
└── types / queryClient                       ~ analytics types & keys
```

**No completed module was modified** (beyond additive route/job wiring). No new
persistent collection was introduced.

---

## 2. Analytics Module Architecture

The module is independent: it **consumes** other modules' services/repositories
but owns no business logic belonging to them.

- **Controllers** — thin: validate the window, call the aggregation service,
  wrap the result. Zero calculation.
- **AnalyticsAggregationService** — the *only* entry point. Orchestrates the six
  domain analytics services, shares one learning overview per request (via
  `AnalyticsContext`, avoiding N+1), and caches every result.
- **Six domain analytics services** — each computes one scope, reusing the
  existing engine's service/repository as the source of truth (e.g.
  `learningAnalyticsService` reuses `progressService`, never re-deriving mastery).
- **AnalyticsRepository** — the only new data access: cross-collection
  aggregation pipelines (solved-problem distributions, activity day-buckets,
  session stats) that no existing repository provides. Read-only.
- **MetricsEngine** — pure metric math shared by all services.

---

## 3. Aggregation Layer

`analyticsAggregationService`:

```
overview(userId, window):
  token   = latestActivityAt(userId)                 // cache freshness signal
  return cache.wrap(key, ttl, token, () => {
    ctx = { overview: progressService.getOverview() } // ONE heavy read, shared
    Promise.all([ learning, problems, knowledge, revision, retention, activity ])
  })

learning|problems|…(userId, window):
  return cache.wrap(`${user}:${scope}:${windowKey}`, ttl, token, producer)
```

- **Parallel** scope execution (`Promise.all`) → overview wall-clock ≈ slowest
  scope, not the sum.
- **Shared context** — the learning overview is fetched once and threaded into
  the learning + knowledge services, eliminating duplicate reads.
- **Reuse, never duplicate** — every scope delegates to the owning engine's
  service; only genuinely-new cross-cutting aggregations live in the analytics
  repository.

---

## 4. MetricsEngine

A single home for reusable, pure, null-safe metric math so a metric is defined
exactly once:

| Function | Meaning |
|---|---|
| `percentage(part, total)` | bounded 0–100 % (0 when total 0) |
| `successRate(s, n)` | solved / attempted % |
| `average(values)` / `weightedAverage(pairs)` | means |
| `velocity(count, windowDays, perDays)` | events normalised per week |
| `growthRate(current, previous)` | period-over-period % |
| `consistency(activeDays, windowDays)` | regularity % |
| `round` / `clampPercent` | display helpers |

Every analytics service composes these — no percentage/rate/average is
re-implemented anywhere.

---

## 5. API Documentation

Base: `/api/analytics` (read-only; user is always the authenticated user —
`userId` is server-derived, never client-supplied, so cross-user aggregation is
impossible).

| Method | Path | Returns |
|---|---|---|
| GET | `/overview` | all six summaries in one payload |
| GET | `/learning` | LearningSummary |
| GET | `/problems` | ProblemSummary |
| GET | `/knowledge` | KnowledgeSummary |
| GET | `/revision` | RevisionSummary |
| GET | `/retention` | RetentionSummary |
| GET | `/activity` | ActivitySummary |

**Query**: `?range=7d|30d|90d|180d|365d|all` **or** `?from=&to=` (custom).
Range and from/to are mutually exclusive; inverted or future windows → `400`.

**Response envelope** (consistent across every analytics endpoint) — a strict
superset of the app-wide `{ success, data }`, so the existing client works
unchanged:

```json
{
  "success": true,
  "status": "success",
  "message": "Analytics overview",
  "timestamp": "2026-07-09T…Z",
  "data": { … },
  "metadata": { "scope": "overview", "range": "30d", "from": "…", "to": "…", "days": 30 }
}
```

---

## 6. DTO Structure

Flat, typed, **chart-agnostic** (Sprint 2 shapes charts from these, not vice
versa). Key figures:

- **LearningSummaryDTO** — topics completed/remaining/total, phases, completion %,
  average mastery/confidence, **learning velocity/wk**, learning time, per-phase
  progress.
- **ProblemSummaryDTO** — total/solved/attempted, success rate, avg solve time,
  **platform + difficulty distributions** (`{key,count,percent}`).
- **KnowledgeSummaryDTO** — entries, representative problems, patterns learned,
  coverage %, documentation rate, avg confidence.
- **RevisionSummaryDTO** — reviews completed, overdue, frequency/wk, avg duration,
  consistency %.
- **RetentionSummaryDTO** — avg retention/confidence, knowledge health,
  at-risk/mastered/needs-review, total tracked.
- **ActivitySummaryDTO** — total, active days, current/longest **streak**,
  daily/weekly/monthly buckets.
- **AnalyticsOverviewDTO** (`= DashboardAnalyticsDTO`) — all six.

---

## 7. Caching Strategy

`AnalyticsCacheService` — a process-local TTL cache with the get/set/wrap/
invalidate contract (Redis is not configured; swap the backing store later with
no call-site change). Invalidation is **twofold and non-invasive**:

1. **TTL expiry** — configurable per scope (`overview` 5 min, sections 3 min).
2. **Freshness token** — the user's *latest Activity timestamp*. Because every
   meaningful mutation (problem solved, revision completed, knowledge updated,
   mastery/progress change) already records an Activity event, a changed token
   busts the cache automatically. **No completed module is touched** to wire
   invalidation — the requirement ("invalidate when problem solved / revision
   completed / knowledge updated / progress changes / dashboard refreshes") is
   met by construction. `invalidateUser()` remains as an explicit hook.

Disabled cleanly under `NODE_ENV=test` for deterministic tests.

---

## 8. Background Job Architecture

`jobs/analyticsRefresh.job.ts`, started in `index.ts`, stopped on shutdown.

- **Independent & non-blocking** — never in a request path, catches its own
  errors, `unref()`s its timer.
- Pre-warms the overview cache (invalidate → recompute) so the first hit after
  idle is instant. Cadence + toggle from config/env.
- The designated seam for future **daily summaries / snapshot generation**
  (Sprint 2+) — no `AnalyticsSnapshot` collection was needed this sprint
  (computed-over-stored), keeping the DB unchanged.

---

## 9. Placeholder Frontend Structure

Pages (metric cards + placeholders, **no charts**): `AnalyticsHome` + `Learning`,
`Problem`, `Knowledge`, `Revision`, `Retention`, `Activity`.

12 reusable components (ready for Sprint 2): `MetricCard`, `AnalyticsSection`,
`SummaryCard`, `InsightCard`, `PlaceholderChart`, `AnalyticsGrid`, `FilterBar`,
`DateRangePicker`, `ComparisonCard`, `StatisticsPanel`, `LoadingAnalytics`,
`EmptyAnalytics`.

State: **React Query** owns all analytics server data (overview + 6 scopes, keyed
by scope + params, `keepPreviousData` for smooth range switches); **Redux** holds
UI only (selected range, custom bounds, comparison flag, view). All values are
backend-computed — the frontend never calculates a metric.

---

## 10. Extension Points for Sprint 2

- **DTOs are chart-agnostic** — charts read `dailyActivity`, `platformDistribution`,
  `phaseProgress`, etc. directly; no contract change needed.
- **`PlaceholderChart`** marks every reserved chart slot; swap for a real chart
  in place. `ComparisonCard` already accepts `previous` — wire period-over-period
  when the backend adds it.
- **`FilterBar` comparison toggle** is live UI state awaiting Sprint-2 deltas.
- **MetricsEngine** absorbs new metrics (trends, forecasts) without touching
  services.
- **AnalyticsRepository** is the pattern for new pipelines (per-phase, per-window
  rollups); the **refresh job** is the seam for `AnalyticsSnapshot` if
  time-series persistence becomes worthwhile.
- **Cache + envelope** are stable — new scopes/endpoints slot in with the same
  wrapper and invalidation for free.

---

## Verification

- **Backend** `tsc --noEmit` → clean.
- **Frontend** `tsc --noEmit` + `vite build` → clean.
- **Smoke** (`npm run test:smoke`) → `✅ ALL ASSERTIONS PASSED`, incl. all six
  analytics summaries aggregating correctly, MetricsEngine sanity, cache
  stability, range validation, and HTTP `200`/`400` coverage for every endpoint —
  e.g. `learning{done=9 velocity=2.1/wk} problems{solved=2/198 success=100%}
  retention{avg=91% health=88%} activity{total=40 streak=1}` and
  `overview=200 … activity=200 badRange=400 badDates=400`.
