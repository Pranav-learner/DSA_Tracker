# Module 4 · Sprint 2 — Analytics Dashboard & Data Visualization

A premium, SaaS-style Analytics Dashboard that turns the Sprint-1 aggregation
layer into intuitive, interactive visualisations. **Presentation only** — the
frontend visualises data, it never computes it. Every number comes from
`/api/analytics/*`; charting is powered by **Recharts** behind a reusable,
themed component library.

Out of scope (later sprints): rule-based insights, weakness detection, report
generation, predictive/AI analytics, contest analytics.

---

## 1. Updated Folder Structure

`＋` new · `~` extended.

```
frontend/src/
├── lib/
│   ├── comparison.ts                         ＋ previous-window + delta/% helpers (consumes existing API)
│   └── analytics.ts                          ~ range presets · tones (Sprint 1)
├── hooks/useAnalytics.ts                     ~ + usePreviousOverview() for comparison
├── store/slices/analyticsSlice.ts            ~ + collapsed sections · distribution-chart pref
├── components/analytics/
│   ├── charts/                               ＋ reusable Recharts library (see §3)
│   │   ├── chartTheme.ts                     ＋ palette from CSS tokens · axis/grid/anim defaults
│   │   ├── ChartContainer · ChartTooltip · ChartLegend
│   │   ├── EmptyChartState · LoadingChartSkeleton
│   │   ├── LineChartCard · AreaChartCard · BarChartCard · PieChartCard · RadarChartCard
│   │   ├── ProgressGauge · ProgressRing · TimelineChart
│   │   └── ContributionHeatmap             ＋ GitHub-style calendar (custom)
│   └── widgets/                              ＋ drop-in dashboard widgets (see §2)
│       ├── LearningOverviewWidget · ProblemOverviewWidget · KnowledgeWidget
│       ├── RevisionWidget · RetentionWidget · ActivityWidget
│       └── MetricWidget · TrendWidget · ContributionWidget · GaugeWidget · WidgetLink
├── pages/
│   ├── AnalyticsHome.tsx                      ~ rebuilt as the premium dashboard
│   └── {Learning,Problem,Knowledge,Revision,Retention,Activity}Analytics.tsx ~ real charts
└── router/index.tsx                          ~ analytics pages lazy-loaded (Recharts code-split)
```

**No backend change** — the sprint reuses the Sprint-1 analytics APIs verbatim.
Recharts was added as the single new dependency.

---

## 2. Component Hierarchy

```
AnalyticsHome (dashboard)
├── FilterBar (DateRangePicker + comparison toggle)
├── Quick Summary — 8× MetricWidget (trend % from current-vs-previous window)
├── By Engine —
│   ├── LearningOverviewWidget   → BarChartCard (completion by phase)
│   ├── ProblemOverviewWidget    → Pie/BarChartCard (difficulty)
│   ├── KnowledgeWidget          → GaugeWidget (coverage)
│   ├── RevisionWidget           → GaugeWidget (consistency)
│   ├── RetentionWidget          → GaugeWidget (health)
│   └── ActivityWidget           → TimelineChart (weekly)
├── Trends — TrendWidget (daily area) + RadarChartCard (learning profile)
├── Contribution — ContributionWidget → ContributionHeatmap
└── Highlights — InsightCard × 3 (factual restatement of data)

Scope pages (lazy) reuse the same chart components with scope-specific data.
```

Every chart nests inside a shared `ChartContainer` (header · body · loading/empty
swap · footer/legend). Widgets are **presentational** (data via props) so they
drop straight onto the Home dashboard in a later sprint.

---

## 3. Chart Architecture

A single themed library wraps Recharts so charts are consistent and swappable:

| Component | Recharts basis | Used for |
|---|---|---|
| `LineChartCard` | LineChart | multi-series trends |
| `AreaChartCard` | AreaChart + gradient | volume over time |
| `BarChartCard` | BarChart (vert/horiz, per-bar colour) | distributions, phase bars |
| `PieChartCard` | PieChart/donut + legend | platform/difficulty mix |
| `RadarChartCard` | RadarChart | multi-axis learning profile |
| `ProgressGauge` | RadialBarChart (270°) | single 0–100 headline metric |
| `ProgressRing` | SVG (framer-motion) | dense small indicators |
| `TimelineChart` | BarChart over `{date,count}` | events/reviews per period |
| `ContributionHeatmap` | custom SVG/grid | GitHub-style activity calendar |

Cross-cutting: `chartTheme.ts` derives all colours from the app's CSS design
tokens (`hsl(var(--primary))`…) so charts are dark-theme-correct with zero JS
colour math; `ChartTooltip`/`ChartLegend` are shared; every chart supports
responsive resizing (`ResponsiveContainer`), loading, empty, tooltips, legends,
animations and ARIA labels.

---

## 4. Dashboard Layout

Desktop: a vertical rhythm of titled `AnalyticsSection`s — **Header → Quick
Summary (8 metric tiles) → By-Engine widget grid (2-col) → Trends (2-col) →
Contribution heatmap (full width) → Highlights (3-col)**. The `FilterBar` (date
range + comparison) sits directly under the header and drives every query.

Responsive: grids collapse to a single column on mobile via `AnalyticsGrid`; the
heatmap scrolls horizontally; charts fluid-resize to their container. Scope pages
follow the same shell (header · filter bar · metric grid · charts).

---

## 5. Visualization Strategy

- **Right chart for the data**: distributions → pie/bar; single scores →
  gauges/rings; time series → area/timeline; multi-axis profile → radar; daily
  cadence → contribution heatmap.
- **Every chart degrades gracefully** — explicit loading skeletons and empty
  states inside the container, so partial/zero data never breaks layout.
- **Comparison overlays are additive** — trend chips on metric tiles show
  period-over-period % without cluttering the chart.
- **The heatmap is forward-compatible** — intensity buckets + a data-driven grid
  ready to overlay future contest activity.

---

## 6. API Consumption Strategy

- The frontend talks **only** to the aggregation layer (`/api/analytics/*`) — no
  module endpoint is queried for analytics.
- **React Query** owns all analytics server state: overview + 6 scopes, keyed by
  `scope + params`, with `keepPreviousData` for flicker-free range switches. The
  overview query is shared by the dashboard; scope pages fetch their own scope.
- **Comparison** reuses the *same* overview endpoint with computed `from`/`to`
  for the preceding window (`usePreviousOverview`) — no new backend algorithm.
  The delta/% is trivial display math in `lib/comparison.ts`.
- **Redux holds UI only** — range, custom bounds, comparison flag, view,
  collapsed sections, distribution-chart preference.

---

## 7. Performance Optimizations

- **Charts are code-split**: analytics pages are `React.lazy` + `Suspense`, so
  Recharts moved out of the main bundle — **1.28 MB → 831 KB** main, with
  Recharts in on-demand async chunks (`CategoricalChart` 288 KB, `BarChart`
  48 KB…) fetched only when analytics is visited.
- **No duplicate requests / no over-fetching**: React Query dedupes by key;
  widgets receive data as props from one overview fetch rather than each
  fetching. The Sprint-1 backend cache still serves repeat hits.
- **Memoised chart data** (`useMemo` in the heatmap; pure prop-mapping
  elsewhere) and pure presentational widgets keep re-renders cheap.
- **Parallel queries** where scopes are independent; `keepPreviousData` avoids
  refetch flashes on filter changes.

---

## 8. The Completed Dashboard (description)

A dark, Linear/Stripe-inspired dashboard: a header with an eyebrow + a
range/comparison filter bar; a row of eight premium metric tiles (Overall
Progress, Mastery, Retention, Problems Solved, Topics Completed, Knowledge
Entries, Revision Completion, Streak) each with a green/red trend chip vs the
previous period; a two-column widget wall where a completion-by-phase bar chart,
a difficulty donut, three radial gauges (coverage · consistency · health) and a
weekly activity timeline each deep-link into their scope page; a trends row
pairing a daily-activity area chart with a six-axis "learning profile" radar; a
full-width GitHub-style contribution heatmap with hover counts and a Less→More
legend; and a highlights strip restating the streak, knowledge health and success
rate. Every scope page mirrors the shell with its own charts (e.g. Retention →
health gauge + knowledge-distribution donut; Activity → heatmap + daily area +
monthly timeline). All states — loading skeletons, empty charts, API errors —
are handled inline.

---

## 9. Extension Points for Sprint 3

- **Widgets are drop-in** — `LearningOverviewWidget`…`ContributionWidget` take
  data as props and already carry deep-links; reuse them on the Home dashboard
  or in reports with no change.
- **`InsightCard`** is the seam for Sprint-3's insight engine — swap the factual
  "Highlights" copy for generated insights; the card contract stays.
- **`ComparisonCard`/`MetricWidget`** already accept previous values — richer
  comparison presets slot in through `lib/comparison.ts`.
- **Chart library is generic** — new charts (e.g. contest heatmap overlays,
  weakness radars) extend `chartTheme` + `ChartContainer` without touching pages.
- **Redux `distributionChart` / `collapsedSections`** show the pattern for
  further per-user chart preferences.
- All data still flows **API → hooks → widgets**, so a Sprint-3 insight endpoint
  plugs into the same React Query pattern with zero refactor.

---

## Verification

- **Frontend** `tsc --noEmit` → clean; `vite build` → success with Recharts
  code-split (main bundle 831 KB; analytics/Recharts in lazy chunks).
- **Backend** unchanged — Sprint-1 analytics APIs consumed as-is; smoke suite
  remains green.
- Charts render real backend data, the contribution heatmap builds from
  `activity.dailyActivity`, comparison mode computes period-over-period deltas
  from a second (cached) overview window, and filters (date range) refetch
  without reloads.
