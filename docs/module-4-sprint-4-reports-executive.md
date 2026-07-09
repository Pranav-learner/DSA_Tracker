# Module 4 · Sprint 4 — Reports, Executive Dashboard & Analytics Integration

The capstone of the Analytics Engine. It composes everything built across Module 4
into an **Executive Dashboard**, a **rule-based reporting system** (weekly /
monthly / phase / summary) and a **multi-format export system** (PDF · Markdown ·
JSON · CSV) — all **server-side, no AI**. Reports *summarise* existing analytics;
they never recompute.

```
Learning Data → Analytics → Insights → Reports → Better decisions
```

Out of scope (later modules): contest analytics, AI-generated reports, predictive
models, personalized coaching, knowledge-graph visualisation.

---

## 1. Updated Folder Structure

`＋` new · `~` extended.

```
backend/src/
├── config/executive.ts                      ＋ score weights + normalisers (configurable)
├── config/reports.ts                        ＋ report cache TTL · job cadence · windows · formats
├── analytics/
│   ├── dto/executive.dto.ts                 ＋ ExecutiveDTO · scores · breakdown
│   ├── services/executiveMetrics.service.ts ＋ 6 composite scores (weighted blends, reuse only)
│   ├── controllers/executive.controller.ts  ＋ GET /api/analytics/executive
│   └── routes/analytics.routes.ts           ~ + /executive
├── reports/                                 ＋ SELF-CONTAINED reporting module
│   ├── dto/report.dto.ts                    ＋ ReportDTO · PhaseReportDTO
│   ├── services/report.service.ts           ＋ weekly/monthly/phase/summary composition (cached)
│   ├── renderers/                           ＋ markdown · csv · pdf (pdfkit) · json
│   ├── validators/report.validator.ts       ＋ export type/format/phase validation
│   ├── controllers/report.controller.ts     ＋ 4 report + 4 export endpoints
│   └── routes/report.routes.ts              ＋ /api/reports/*
├── jobs/reportGeneration.job.ts             ＋ precompute executive + warm report caches
├── index.ts / routes/index.ts               ~ start job · mount /api/reports
└── tests/roadmap.integration.ts             ~ executive + report + export (incl. PDF) assertions

frontend/src/
├── api/analytics.api.ts                     ~ + reportsApi · executive · downloadReportExport
├── hooks/useReports.ts                      ＋ executive · weekly/monthly/summary/phase · export mutation
├── store/slices/analyticsSlice.ts           ~ + export format · print mode
├── components/reports/ (14) · executive/ (6) ＋ report + executive component sets
├── pages/ (6)                               ＋ Executive · Weekly · Monthly · Phase · Summary · Export
├── router/index.tsx · layout/Sidebar.tsx     ~ lazy routes + Executive/Reports nav
└── index.css                                ~ @media print (hide chrome, flow content)
```

New dependency: **pdfkit** (pure-JS, server-side PDF — no headless browser).

---

## 2. ReportService Architecture

One service owns all report composition; a report is a pure COMPOSITION of
existing data for a window:

```
reportService.weekly|monthly|summary|phase(userId)
        ▼  (cached via the analytics cache — TTL + activity-token invalidation)
buildBase(window):
   analyticsAggregationService.overview(window)   ┐ reused
   patternIntelligenceService.overview(window)    │ reused
   executiveMetricsService.computeScores(overview)┘ reused
        ▼
ReportDTO { meta · scores · summary · keyMetrics · overview · trends ·
            achievements · strengths · weaknesses · recommendations · nextGoals }
```

- **Weekly** = 7-day window · **Monthly / Summary** = 30-day · **Phase** = base +
  phase-scoped slice (patterns/strengths/weaknesses filtered to the phase) +
  **estimated readiness** (`0.6·completion + 0.4·avg pattern mastery`).
- `summary`, `achievements`, `nextGoals` are **rule-based template strings** over
  the data — no AI. Phase existence is validated (`400`/`404`).

---

## 3. ExecutiveMetricsService

Six composite scores, each a **weighted blend of existing analytics metrics**
(weights in `config/executive.ts`) — no new aggregation:

| Score | Blend |
|---|---|
| Learning | completion · mastery · velocity |
| Knowledge | coverage · confidence · documentation |
| Retention | retention · knowledge-health |
| Revision | consistency · review-completion |
| Productivity | streak · active-days · velocity |
| **Overall Readiness** | weighted blend of the five |

Raw counts (velocity, streak, active-days) are normalised against configurable
"great" targets. The service also returns the score breakdown, headline progress,
pattern-health counts, current phase/topic and the top insights/recommendations.

---

## 4. Report Generation Flow

```
GET /api/reports/{weekly|monthly|summary|phase/:id}  → ReportDTO (analytics envelope)
GET /api/reports/export/{pdf|markdown|json|csv}?type=…&phaseId=…
        ▼ resolveReport(type) → reportService.*  (cache hit if warm)
        ▼ renderer(report)
   pdf → pdfkit Buffer   (application/pdf, score bars drawn)
   markdown → string     (text/markdown)
   json → JSON.stringify  (application/json)
   csv → analytics tables (text/csv)
        ▼ Content-Disposition: attachment; filename=cp-os-<kind>-report.<ext>
```

The **ReportGenerationJob** (independent, non-blocking, `unref`'d) precomputes
executive metrics and warms the weekly/monthly/summary caches hourly, so report
and export requests are instant.

---

## 5. Export Architecture

- **Server-side rendering** for all four formats — the client only downloads.
- **PDF** via pdfkit: a clean, printable, light-theme A4 with header, drawn score
  bars ("charts where possible"), key-metric grid, and bulleted
  achievements/strengths/weaknesses/recommendations/goals.
- **Markdown** renders shareable headings + tables; **CSV** flattens the
  analytics *tables* (scores, metrics, trends, distributions, phases); **JSON** is
  the raw report DTO.
- Frontend `downloadReportExport()` fetches the file and saves it via an object
  URL — plus a **Print** button that uses the browser's native print-to-PDF over
  the `@media print` stylesheet (chrome hidden, content flowed, light theme).

---

## 6. API Documentation

| Method | Path | Returns |
|---|---|---|
| GET | `/api/analytics/executive` | ExecutiveDTO (scores · breakdown · progress · insights · recommendations) |
| GET | `/api/reports/weekly` · `/monthly` · `/summary` | ReportDTO |
| GET | `/api/reports/phase/:phaseId` | PhaseReportDTO (`400` bad id · `404` unknown) |
| GET | `/api/reports/export/pdf\|markdown\|json\|csv` | file download (`?type=`, `?phaseId=` for phase; `400` if phase without id) |

All reads use the analytics envelope + cache + window; user is always the
authenticated user (no cross-user access).

---

## 7. Component Hierarchy

```
Executive Dashboard → OverallScoreCard · ReadinessCard · ProgressOverview ·
   HealthBreakdown · ExecutiveRecommendationCard · Knowledge/Revision/RetentionWidget (reused)

Report pages → ReportView:
   ReportHeader (ExportPanel + PrintButton) · ReportSummary · MetricSection ·
   ReportChart (score bars) · ReportTimeline · Trend/Achievement cards ·
   Strength/Weakness/Recommendation sections   [all wrapped in PrintableLayout]

Reusable: ReportHeader · ReportSummary · MetricSection · ScoreBars · ReportChart ·
   Insight/Strength/Weakness/Recommendation sections · AchievementCard ·
   ReportTimeline · ExportPanel · PrintableLayout · ExecutiveScoreCard · ReportView
   + executive: OverallScoreCard · ReadinessCard · LearningHealthScore ·
     HealthBreakdown · ProgressOverview · ExecutiveRecommendationCard.
```

Every component reuses the Sprint-2 charts and Sprint-3 intelligence cards — no
duplicated UI. React Query owns all report/executive server data; Redux holds
UI-only state (export format, print mode). No business logic on the frontend.

---

## 8. The Executive Dashboard & Reports (description)

The **Executive Dashboard** leads with a large Overall-Readiness gauge beside the
five sub-scores, a readiness badge, and the current phase/topic; then a
progress-overview metric grid, a health-breakdown bar panel next to a
recommendation summary, pattern-health counts, reused engine-health widgets
(knowledge/revision/retention gauges) and key insights. Each **report** renders as
a centered, printable document: a header with export buttons (PDF/MD/JSON/CSV) and
a Print button, a highlighted summary, a key-metric grid, an executive-score bar
chart beside a numbered next-goals timeline, trend tiles, achievement cards, and
strength/weakness/recommendation sections. The **Phase Report** adds a readiness
panel; the **Export Center** offers per-report export cards plus a phase picker.
Printing hides all app chrome and switches to a light theme for a share-ready page.

---

## 9. Performance Optimizations

- **Reports are cached** (analytics cache, TTL + activity-token invalidation) and
  **pre-warmed** by the background job — expensive composites don't run on the
  request path.
- **No duplicate calculation** — reports/executive reuse the already-cached
  analytics overview + intelligence; a single overview per window feeds all.
- **Frontend code-splits** every report/executive page (`React.lazy`), keeping
  the main bundle at ~837 KB; React Query dedupes report queries.
- Exports stream server-rendered buffers/strings; the PDF library is pure-JS
  (no browser spin-up).

---

## 10. Extension Points for Module 5 (Contest Engine)

- **ReportService** is additive — a contest report slots in as another
  `buildBase`-style composer; the renderers already handle any `ReportDTO`.
- **ExecutiveMetricsService** can gain a "Contest Readiness" score by adding a
  weight in `config/executive.ts` (the pattern matrix already reserves a
  contest-readiness dimension).
- **Renderers + ExportPanel** accept new report kinds with no change.
- **The report job** is the seam for scheduled contest digests.
- Analytics cache, envelope, window and the printable layout are unchanged, so
  Module 5 endpoints/pages reuse them directly — no refactor required.

---

## Verification

- **Backend** `tsc --noEmit` → clean; **frontend** `tsc` + `vite build` → clean
  (report/executive pages code-split; main bundle 837 KB).
- **Smoke** (`npm run test:smoke`) → `✅ ALL ASSERTIONS PASSED`, incl. six
  executive scores + breakdown, all four reports (weekly/monthly/summary/phase
  with estimated readiness), the markdown/csv renderers, a **valid PDF buffer**
  (`%PDF-` header), and HTTP `200`/`404`/`400` for every report + export endpoint
  (PDF verified as `application/pdf`) — e.g. `executive: readiness=44% …` and
  `export pdf=200/true md=200 json=200 csv=200 phasePdf=200 exportBad=400`.
- **No AI** — every report is a rule-based composition of existing analytics.
