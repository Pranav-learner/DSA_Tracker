# Module 5 · Sprint 4 — Competitive Intelligence Engine & Performance Analytics

The flagship of Module 5. Every prior sprint measured contest activity; this one
**explains it**. The Competitive Intelligence Engine correlates *learning
behaviour* (patterns, revision, knowledge coverage, mastery, solve speed) with
*contest outcomes* (rating, rank, consistency) and answers the only question
that matters between contests: **why did performance move, and what should I do
next?**

Strictly **rule-based** — threshold comparisons over metrics the platform
already computes. **No AI, no ML, no statistical inference, no predictive rating
models.** The engine is an *orchestrator*: it reuses Module 1–4 services
(analytics overview, pattern intelligence, retention, rating, upsolve) and adds
zero parallel business logic.

Out of scope (explicitly deferred): AI coaching, predictive rating models,
adaptive contest planning, external contest-API sync beyond the existing
provider abstraction, and any ML.

---

## 1. Updated Folder Structure

`＋` new · `~` extended.

```
backend/src/
├── config/competitive.ts                               ＋ weights · normalisers · thresholds
├── models/ReadinessProfile.ts                          ＋ contest/interview/HFT readiness (1 doc/user)
├── contests/
│   ├── repositories/readiness.repository.ts            ＋ findByUser · upsert · deleteByUser
│   ├── dto/competitive.dto.ts                          ＋ rating · readiness · correlation · insight · rec · intelligence
│   ├── services/
│   │   ├── ratingAnalytics.service.ts        ＋ current/peak/avg · trend · growth · gains · consistency · per-platform
│   │   ├── contestReadiness.service.ts       ＋ 6 weighted sub-scores → overall + persists ReadinessProfile
│   │   ├── contestCorrelation.service.ts     ＋ 5 rule-based learning↔outcome correlations
│   │   ├── competitiveIntelligence.service.ts＋ orchestrator: insights + recs + cached sections
│   │   └── competitiveActivity.service.ts    ＋ deduped activity emission (job-only)
│   ├── controllers/competitiveIntelligence.controller.ts ＋ 5 read endpoints
│   └── routes/contest.routes.ts              ~ + competitiveRouter (/api/contest/*)
├── contests/dto/contest.dto.ts · services/contest.service.ts ~ dashboard exposes contestReadiness
├── types/domain.ts                           ~ + 4 activity types
├── jobs/analyticsRefresh.job.ts              ~ emits competitive activity
├── routes/index.ts                           ~ mounts competitiveRouter + endpoint list
└── tests/roadmap.integration.ts              ~ service + HTTP + persistence assertions

frontend/src/
├── lib/competitive.ts                        ＋ readiness/correlation/insight/action meta maps
├── api/contest.api.ts                        ~ competitiveApi (5 GETs)
├── hooks/useCompetitive.ts                   ＋ 5 React Query hooks
├── lib/queryClient.ts                        ~ 5 competitive query keys
├── types/index.ts                            ~ competitive types + DashboardContest.contestReadiness + 4 activity types
├── components/contest/competitive/           ＋ 13 reusable components + barrel
├── components/contest/ContestSummaryCard.tsx ~ Home readiness widget
├── components/dashboard/ActivityTimeline.tsx ~ icons for 4 new activity types
├── components/layout/Sidebar.tsx             ~ "Competitive" nav item
├── pages/CompetitiveIntelligencePage.tsx     ＋ full dashboard page
└── router/index.tsx                          ~ lazy route /contests/intelligence
```

---

## 2. Rating Analytics Service

`ratingAnalytics.service.ts::analyze(userId)` reuses `ratingService.summary` and
`ratingRepository.findHistory` — it computes nothing the rating module already
owns, it *derives* from it:

| Field | Derivation |
| --- | --- |
| `currentRating` / `highestRating` / `lowestRating` / `averageRating` | from rating summary + history |
| `ratingTrend` | `rising` / `falling` / `stable` from net growth over recent history |
| `ratingGrowth` | last − first rated result |
| `averageRatingGain` | mean of per-contest deltas |
| `largestGain` / `largestLoss` | best / worst single delta |
| `contestConsistency` | % of rated contests that were non-negative |
| `ratedContests` | count |
| `timeline` | `{date, rating}[]` for the trend chart |
| `platformStats` | per-platform `{current, highest, contests}` (multi-provider) |

No provider-specific logic leaks in — everything routes through the existing
provider abstraction.

---

## 3. Contest Readiness Service

Readiness is a **weighted composite of six signals**, every one reusing an
existing analytics metric. Weights, normalisers and status bands are entirely
config-driven (`config/competitive.ts`).

| Sub-score | Source metric | Weight |
| --- | --- | --- |
| Pattern readiness | `patternIntelligence.overview` avg confidence | 0.24 |
| Implementation readiness | analytics problem accuracy / speed | 0.18 |
| Revision readiness | analytics revision health | 0.16 |
| Knowledge readiness | retention `knowledgeHealthPercent` | 0.16 |
| Recent-practice readiness | recent solves ÷ `recentSolvesMax` (40) | 0.14 |
| Contest-frequency readiness | contests/month ÷ `contestsPerMonthMax` (6) | 0.12 |

`compute(userId)` → weighted `overall`, classified by
`READINESS_STATUS_THRESHOLDS` (`ready ≥80`, `developing ≥60`, `early ≥40`, else
`not-ready`), then **persisted** to the `ReadinessProfile` document. `strongAreas`
/ `weakAreas` fall out of the per-sub-score status. Changing a weight in config
changes the score — no code edit.

---

## 4. Contest Correlation Service

Genuinely rule-based: `correlate(xLabel, yLabel, xValue, yValue)` compares two
0–100 metrics against `CORRELATION_THRESHOLDS` (`high 60`, `low 40`) and emits a
`direction` + `strength` + a plain-English `insight` — **no covariance, no
regression, no ML**.

Logic: both high → *positive / aligned*; both low → *positive* (consistent, if
low); one high & one low → *negative / diverging*; otherwise *neutral*.

Five correlations shipped:

1. **Pattern Confidence → Contest Success**
2. **Revision Consistency → Performance Stability**
3. **Knowledge Coverage → Problem Solving**
4. **Average Solve Time → Rank**
5. **Topic Mastery → Rating Growth**

---

## 5. Competitive Intelligence Service (Orchestrator)

`competitiveIntelligence.service.ts` owns no business logic of its own — it
**composes** the services above plus `analyticsAggregationService.overview`,
`patternIntelligenceService.weaknesses`/`overview` and `upsolveService.queue`:

- `overview()` → the full `CompetitiveIntelligence` payload (summary · strengths
  · weaknesses · insights · recommendations · readiness · correlation ·
  ratingAnalysis).
- `buildInsights(...)` → measurable, metric-referencing insights
  (`strength` / `improvement` / `opportunity` / `focus` / `weakness` / `warning`),
  each with a `reason`, a `suggestedAction`, and `relatedTopics`. Capped at
  `COMPETITIVE_LIMITS.maxInsights` (20).
- `buildRecommendations(...)` → contest-aware recs (**Upsolve**, **Revise Weak
  Patterns**, **Improve Speed**, **Strengthen Topic**, **Practice / Virtual
  Contest**) each routed to a real in-app destination (`/upsolve`, `/revision`,
  `/problems`, `/topic/:id`, `/contests/new`). Capped at
  `COMPETITIVE_LIMITS.maxRecommendations` (10).

Every section is cached through
`analyticsAggregationService.section(userId, window, scope, producer)` — the same
TTL + latest-activity-token invalidation used by Module 4, so competitive data
reuses the analytics cache rather than adding a new one.

---

## 6. Readiness Profile (Backend-only architecture placeholder)

`ReadinessProfile` persists one document per user with `contestReadiness` (live)
plus `interviewReadiness` and `hftReadiness` **placeholders** (derived cheaply
today: interview ≈ mean of pattern/implementation/knowledge; HFT ≈ 70 % of
overall). No UI beyond the numbers the contest dashboard already needs — the
model exists so Module 6+ can light up interview/HFT tracks without a migration.

---

## 7. API

All read-only, all under `/api/contest`, all cached:

| Endpoint | Returns |
| --- | --- |
| `GET /api/contest/intelligence` | full `CompetitiveIntelligence` payload |
| `GET /api/contest/readiness` | `ContestReadiness` (overall + 6 sub-scores + areas) |
| `GET /api/contest/correlation` | `ContestCorrelation` (5 items) |
| `GET /api/contest/insights` | `CompetitiveInsight[]` |
| `GET /api/contest/rating-analysis` | `RatingAnalysis` |

---

## 8. Frontend — Components & Dashboard

**13 reusable components** in `components/contest/competitive/` (barrelled),
every chart reusing Module 4 primitives (`ChartContainer`, `BarChartCard`,
`LineChartCard`, `ProgressGauge`, `ScoreBars`, `MetricCard`, `AnalyticsSection`,
`SeverityIndicator`, `PriorityBadge`, `StrengthCard`, `WeaknessCard`):

`ReadinessGauge` · `ContestReadinessCard` · `RatingTrendCard` ·
`RatingStatisticsCard` · `PerformanceCorrelationChart` · `CorrelationMatrix` ·
`CompetitiveInsightCard` · `PerformanceSummaryCard` ·
`ImprovementOpportunityCard` · `RecommendationPanel` · `ContestHealthCard` ·
`TrendComparisonCard` · `CompetitiveDashboard`.

`CompetitiveIntelligencePage` (`/contests/intelligence`, lazy) renders the
`CompetitiveDashboard` container with sections: **Overall Performance · Rating
Analysis · Contest Readiness · Performance Correlation · Improvement
Opportunities · Learning Impact · Competitive Insights · Recommendations**.

Server data via **React Query** (`useCompetitive.ts`, keys in `queryClient.ts`);
Redux holds **UI state only**. Meta maps (status/correlation/insight/action
tones + labels) live in `lib/competitive.ts` so components stay presentational.

---

## 9. Dashboard & Activity Integration

- **Home dashboard**: `ContestSummaryCard` gains a **contest-readiness bar**
  (score · status · progress) linking to the intelligence page, fed by the new
  `DashboardContest.contestReadiness` field the contest service now reads from
  the persisted `ReadinessProfile` (imported repository directly to avoid a
  circular import with `contestReadinessService`).
- **Sidebar**: new **"Competitive"** nav item.
- **Activity events** (`competitiveActivity.service.ts`, emitted from the
  analytics-refresh **job only**, deduped against recent titles):
  `contest-readiness-updated` · `competitive-insight-generated` ·
  `rating-milestone-reached` · `weak-pattern-detected`. `ActivityTimeline` renders
  an icon for each.

---

## 10. Verification

- Backend `tsc --noEmit` clean; `roadmap.integration` smoke extended and green —
  readiness overall + 6 sub-scores, 5 correlations, insights, recommendations,
  `ReadinessProfile` persistence, `dashboard.contest.contestReadiness`, and all
  five `/api/contest/*` endpoints returning 200.
- Frontend `tsc --noEmit` clean; `vite build` green with
  `CompetitiveIntelligencePage` code-split into its own lazy chunk (~29 kB).

---

## Module 6 (Gamification) — Extension Points

- **`ReadinessProfile`** already persists per-user readiness — XP/streak/level
  systems can hang off it (and the interview/HFT slots) without a new collection.
- **Config-driven weights/thresholds** (`config/competitive.ts`) mean
  gamified difficulty tiers can re-weight readiness purely via config.
- **Activity events** are the natural achievement triggers
  (`rating-milestone-reached` → badges; `weak-pattern-detected` → quests).
- **Recommendation actions** (`CompetitiveActionType` + routed `.to`) are
  ready-made "quest" targets — a gamification layer can wrap them as challenges.
- **Cached section producers** compose cleanly, so a leaderboard/points service
  can reuse the same aggregation seam rather than recomputing.
