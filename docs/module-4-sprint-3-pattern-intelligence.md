# Module 4 · Sprint 3 — Pattern Intelligence, Insight Engine & Weakness Detection

The layer that explains **why**. On top of the Sprint-1 aggregation layer and the
Sprint-2 visualisations, this sprint adds a fully **rule-based** intelligence
engine that profiles every pattern, detects weaknesses and strengths, analyses
trends, generates a dynamic insights feed and produces actionable
recommendations. **No AI / ML** — every signal is a configurable threshold over
existing analytics data.

```
Raw Analytics → Pattern Intelligence → Insights → Recommendations → Better decisions
```

Out of scope (later modules): PDF/weekly/monthly reports, contest analytics,
AI coaching, predictive models, knowledge-graph visualisation.

---

## 1. Updated Folder Structure

`＋` new · `~` extended.

```
backend/src/
├── config/insights.ts                        ＋ ALL thresholds/weights (configurable, no hardcoding)
├── analytics/
│   ├── dto/intelligence.dto.ts               ＋ PatternProfile · Matrix · Weakness · Strength · Trend · Insight · Recommendation
│   ├── repositories/analytics.repository.ts  ~ + problemStatsByTopic() aggregation
│   ├── services/
│   │   ├── patternAnalytics.service.ts        ＋ per-pattern profile + confidence matrix (reuse mastery/retention/problems)
│   │   ├── weaknessDetection.service.ts       ＋ rule-based weakness signals
│   │   ├── strengthDetection.service.ts       ＋ rule-based strength signals
│   │   ├── trendAnalysis.service.ts           ＋ current-vs-previous window directions (reuse aggregation)
│   │   ├── insightEngine.ts                   ＋ composes the dynamic insights feed
│   │   ├── analyticsRecommendation.service.ts ＋ actionable recommendations (complements Module 1)
│   │   ├── patternIntelligence.service.ts     ＋ orchestrator + caching (single entry point)
│   │   └── insightActivity.service.ts         ＋ emits deduped insight activities (job-only)
│   ├── controllers/intelligence.controller.ts ＋ 7 handlers (no business logic)
│   └── routes/analytics.routes.ts             ~ + /patterns, /weaknesses, /strengths, /insights, /trends, /recommendations
├── types/domain.ts                            ~ + 4 activity types (insight/pattern/recommendation)
├── jobs/analyticsRefresh.job.ts               ~ emits insight activities each run
└── tests/roadmap.integration.ts               ~ intelligence service + HTTP assertions

frontend/src/
├── lib/intelligence.ts                        ＋ severity/priority/status/trend meta + matrix dimensions
├── api/analytics.api.ts · hooks/useAnalytics.ts ~ + 7 intelligence endpoints/hooks
├── store/slices/analyticsSlice.ts             ~ + selected pattern · severity filter
├── components/analytics/intelligence/         ＋ 12 components (see §7)
├── pages/ (7)                                  ＋ PatternIntelligence · PatternDetail · Weakness/Strength Report · Insights · Trends · Recommendations
└── router/index.tsx                           ~ intelligence pages lazy-loaded
```

**No previous module was modified.** The Module 1 RecommendationService is left
untouched; the analytics recommendation service *complements* it.

---

## 2. Insight Engine Architecture

`insightEngine.generate(userId, window)` composes the other engines' outputs into
a human-readable feed — pure composition, no aggregation of its own:

```
profiles ─┬─► weaknessDetection ─┐
          ├─► strengthDetection ─┤
          └─► trendAnalysis ─────┼─► InsightEngine ──► InsightDTO[]
              progress overview ─┘        │
   trend↑/↓ → trend insight               │  (ranked: high-priority weaknesses →
   strong/improving → positive insight    │   trends → positives, capped at N)
   high/med weakness → negative insight    │
   phase ≥75/100% → milestone insight     ┘
```

Examples produced: *"Confidence is rising (+12%)"*, *"Graphs need review"*,
*"75% through Phase 2"* — all generated dynamically from data.

---

## 3. Pattern Intelligence Architecture

`patternAnalyticsService.profiles()` builds one profile per active topic by
**reusing** existing sources — it owns no mastery/retention math:

| Matrix dimension | Source (single source of truth in `config/insights.ts`) |
|---|---|
| Understanding | mastery `standard` |
| Recognition | mastery `recognition` |
| Implementation | mastery `implementation` |
| Optimization | mastery `mixed` |
| Contest Readiness | mastery `contest` *(placeholder)* |
| Confidence | mastery `confidence` |
| Retention | RetentionService profile `retentionScore` |
| Overall Mastery | `masteryService.computeOverall()` |

Behavioural signals (attempt success, avg solve time, hint/editorial dependency,
revision success) come from a new per-topic aggregation
(`analyticsRepository.problemStatsByTopic`) + the retention profile. Each pattern
gets a status (`strong` / `developing` / `needs-work`).

---

## 4. Weakness (and Strength) Detection Strategy

Every rule reads a **configurable threshold**; severity is *how far past* the
threshold a signal sits (`SEVERITY_BANDS`). Nothing is hardcoded.

Weakness detectors: low mastery · low confidence · at-risk retention · high hint
usage · high editorial dependency · slow solve time · high failure rate · low
revision consistency · knowledge gap (no practice). Strength detectors mirror
them: strong topic · high confidence · fast solver · excellent retention ·
consistent revisions · recent improvement (rising confidence trend). Both reuse
`patternAnalyticsService` (no duplicated aggregation) and rank most-severe /
strongest first.

---

## 5. Recommendation Generation Flow

```
weaknesses (severity-ranked) ──► category → action map (config)
                                   low-mastery/failure/gap → practice-problems
                                   low-confidence/at-risk/low-revision → start-revision
                                   hint/editorial/slow → practice-problems
strong patterns ──────────────► open-topic ("mastered — move on")
        ▼  dedup by (entity, action), priority = severity, impact = severity
AnalyticsRecommendationDTO[]  (title · reason · action · route · est. time · impact)
```

Recommendations are actionable and routed to existing pages (`/topic/:id`,
`/revision`, `/notebook`, `/problems`) — rule-based, no AI. This service extends
the analytics layer **without modifying** the Module 1 RecommendationService.

---

## 6. API Documentation

All under `/api/analytics`, read-only, same analytics envelope
(`status/message/timestamp/data/metadata`), cached (TTL + activity-token
invalidation), user always the authenticated user.

| Method | Path | Returns |
|---|---|---|
| GET | `/patterns` | `PatternProfile[]` (weakest first) |
| GET | `/patterns/:patternId` | one profile + full matrix (`400` bad id · `404` unknown) |
| GET | `/weaknesses` | `Weakness[]` (severity-ranked) |
| GET | `/strengths` | `Strength[]` |
| GET | `/insights` | `Insight[]` (dynamic feed) |
| GET | `/trends` | `Trend[]` (direction current-vs-previous) |
| GET | `/recommendations` | `Recommendation[]` (priority-ranked) |

All accept the shared `?range` / `?from&to` window.

---

## 7. Component Hierarchy

```
Pages (lazy)
├── PatternIntelligence → PatternCard[] (mastery ring · status · signals)
├── PatternDetail       → ConfidenceRadar + PatternMatrix + MetricCard[] (flagship)
├── WeaknessReport      → SeverityIndicator + WeaknessCard[] (severity filter)
├── StrengthReport      → StrengthCard[]
├── LearningInsights    → IntelInsightCard[] (dynamic feed)
├── TrendAnalysis       → TrendCard[] + BarChartCard (current vs previous)
└── RecommendationCenter→ RecommendationCard[] (PriorityBadge)

Reusable intelligence components (12): PatternMatrix · PatternCard · ConfidenceRadar
· WeaknessCard · StrengthCard · IntelInsightCard · TrendCard · RecommendationCard
· PriorityBadge · SeverityIndicator · TrendIndicator · PatternComparisonCard.
```

All reuse the Sprint-2 chart library (`RadarChartCard`, `ProgressRing`,
`BarChartCard`) and the analytics layout — no duplicated UI. State: React Query
owns all intelligence data; Redux holds UI-only (selected pattern, severity
filter). No business logic on the frontend.

---

## 8. The Pattern Intelligence Dashboard (description)

`AnalyticsHome` gains a **Pattern Intelligence** nav strip (Patterns · Weaknesses
· Strengths · Insights · Recommendations). The flagship **Pattern Detail** page
shows a confidence-matrix radar beside a labelled eight-bar Pattern Confidence
Matrix (Understanding, Recognition, Implementation, Optimization, Contest-Ready
*(preview)*, Confidence, Retention, Overall), then behavioural metric tiles and
an "Open topic" action. The **Weakness Report** ranks severity-bordered cards
(red/amber/grey) with a recommended next step and a severity filter; the
**Strength Report** mirrors it in green. **Learning Insights** is a two-column
sentiment-toned feed; **Trend Analysis** pairs trend tiles (arrow + delta) with a
current-vs-previous bar chart; the **Recommendation Center** lists priority-badged
cards each with an estimated time, impact and a one-tap action. All dark-theme,
responsive, with loading/empty/error states.

---

## 9. Activity Integration

Four new activity types — `insight-generated`, `pattern-improved`,
`pattern-at-risk`, `recommendation-created` — reuse the Activity model and render
in the timeline. They are emitted **only by the background analytics job**
(`insightActivityService`), capped per run and **deduped** against recent titles,
so the feed never spams and no request path writes.

---

## 10. Extension Points for Sprint 4 (Reports)

- **Every intelligence DTO is report-ready** — a report generator serialises
  `patterns`/`weaknesses`/`strengths`/`trends`/`insights`/`recommendations`
  straight from `patternIntelligenceService.overview()`; no recompute.
- **`config/insights.ts`** centralises tuning — reports/exports reuse the same
  thresholds.
- **`PatternComparisonCard`** and the matrix radar are drop-in for
  comparison-heavy report pages.
- **The insights feed + activity events** already persist the narrative a weekly
  report will summarise.
- **Cache + envelope + window** are unchanged, so new report endpoints slot in
  with the same wrapper and invalidation.

---

## Verification

- **Backend** `tsc --noEmit` → clean; **frontend** `tsc` + `vite build` → clean
  (intelligence pages code-split; main bundle 835 KB).
- **Smoke** (`npm run test:smoke`) → `✅ ALL ASSERTIONS PASSED`, incl. pattern
  profiles + full confidence matrix, weakness severities + thresholds, strengths,
  8 trend directions, dynamic insights, actionable recommendations, single-pattern
  lookup + not-found, and HTTP `200`/`404`/`400` for all 7 endpoints — e.g.
  `patterns=11 weaknesses=4 strengths=18 trends=8 insights=10 recs=7`.
- **No AI/ML** anywhere — every signal is a configurable rule over existing data.
