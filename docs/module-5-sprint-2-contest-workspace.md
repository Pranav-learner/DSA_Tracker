# Module 5 · Sprint 2 — Contest Workspace, Performance Tracking & Timeline

Every contest becomes a complete **performance-analysis workspace**: its
problems, a chronological timeline, aggregated performance and derived
statistics, plus contest notes — all persisted. Built on the Sprint-1 Contest
Library; contest-specific logic stays isolated in the Contest module.

Out of scope (Sprint 3+): postmortem analysis, upsolve engine, contest
intelligence, weakness detection, AI, recommendations.

---

## 1. Updated Folder Structure

`＋` new · `~` extended.

```
backend/src/
├── models/ContestProblem.ts · ContestTimelineEvent.ts · ContestPerformance.ts  ＋ 3 collections
├── contests/
│   ├── repositories/contestProblem · contestTimeline · contestPerformance      ＋ DB only
│   ├── dto/workspace.dto.ts                                                     ＋ problem · event · performance · statistics · workspace
│   ├── services/
│   │   ├── contestPerformance.service.ts   ＋ recompute stats from problems (the only place)
│   │   ├── contestTimeline.service.ts      ＋ create/list events + offsets
│   │   ├── contestWorkspace.service.ts     ＋ aggregate + problem CRUD + activity
│   │   └── contest.service.ts              ~ export requireOwnedContest + latestPerformance
│   ├── validators/contestWorkspace.validator.ts  ＋ problem/timeline validation
│   ├── controllers/contestWorkspace.controller.ts ＋ workspace/problems/timeline/performance
│   └── routes/contest.routes.ts            ~ + workspace routes
├── types/domain.ts                         ~ CONTEST_EVENT_TYPES + 3 activity types
├── services/dashboard.* / contest.dto.ts   ~ latest-contest performance
├── seed/seed.ts                            ~ full workspace for the featured CF contest
└── tests/roadmap.integration.ts            ~ workspace service + HTTP assertions

frontend/src/
├── lib/contestWorkspace.ts                 ＋ status/event meta + offset fmt
├── api/contest.api.ts · hooks/useContestWorkspace.ts ＋ workspace CRUD hooks
├── store/slices/contestSlice.ts            ~ selected problem · timeline/status filters
├── components/contest/workspace/ (14)      ＋ workspace component set
├── pages/ (4)                              ＋ Workspace · Timeline · Performance · Problem Breakdown
├── pages/ContestDetail.tsx                 ~ workspace links + "Open Workspace"
└── router · DashboardPage · ContestSummaryCard  ~ routes + resume-analysis
```

---

## 2. MongoDB Schemas

**ContestProblem** — `{ contestRef, userId, problemCode, problemName,
platformProblemId, url, index, difficulty, tags[], solved, skipped, attempted,
attempts, firstAttemptAt, solvedAt, totalTimeSpent, penalty, timestamps }`.
Indexes: unique `{userId, contestRef, problemCode}` (duplicate guard),
`{contestRef, index}`, `userId`.

**ContestTimelineEvent** — `{ contestRef, userId, timestamp, eventType (10
types), problemRef, problemCode, description, createdAt }`. Append-only. Index:
`{contestRef, timestamp}`.

**ContestPerformance** — cached aggregate `{ contestRef (unique), userId,
totalSolved, totalAttempts, wrongAttempts, penalty, averageSolveTime,
fastestSolve, slowestSolve, solvedProblems[], unsolvedProblems[],
skippedProblems[], timestamps }`.

---

## 3. Contest Workspace Architecture

```
ContestWorkspaceService.getWorkspace(userId, contestId)
   ├── contestService.getById()               ← ownership + contest DTO (reused)
   ├── contestProblemRepository.findByContest()
   ├── contestPerformanceService.get()         ← cached, recomputed on demand
   └── contestTimelineService.list(start)       ← chronological + offsets
        ▼
   { contest · problems · performance · timeline · statistics · notes }
```

Problem CRUD lives in the workspace service; **every mutation recomputes
performance** (`contestPerformanceService.recalculate`) so the cached record
never drifts. Ownership is enforced via the shared `requireOwnedContest` (problem
mutations additionally check the problem's `userId`). Contest-specific logic
stays inside the Contest module; ProgressService/RatingService are reused, not
duplicated.

---

## 4. ContestPerformanceService

The **single source** of contest performance. `recalculate(userId, contestRef)`
loads the contest's problems and derives:

- `totalSolved`, `totalAttempts`, `wrongAttempts` (= Σ `attempts − (solved?1:0)`),
- `penalty` (Σ solved-problem penalties), `averageSolveTime`, `fastestSolve`,
  `slowestSolve`,
- solved / unsolved / skipped problem-code lists,

then **upserts** the `ContestPerformance` cache. `get()` returns the DTO
(recomputing if the cache is empty) plus contest duration and a derived
`problemSuccessRate`. No other service computes contest performance.

---

## 5. ContestTimelineService

Creates chronological events (append-only) and reads them **always sorted by
timestamp**. Each event's `offsetMinutes` (contest clock) is derived from the
contest start at read time — the model stores only the absolute timestamp.
`contest-started` / `contest-finished` events also emit the corresponding
Activity events (wired in the workspace service). Reads accept an optional
`limit` for lazy-loading large timelines.

---

## 6. API Documentation

Standard `{ success, data }` envelope; `userId` server-derived; `assertObjectId`
guards ids.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/contests/:id/workspace` | full workspace payload |
| GET \| POST | `/api/contests/:id/problems` | list · add (`409` duplicate) |
| PATCH \| DELETE | `/api/contests/problems/:problemId` | update · remove (re-aggregates) |
| GET \| POST | `/api/contests/:id/timeline` | chronological events · append (`400` bad type) |
| GET | `/api/contests/:id/performance` | aggregated performance |

---

## 7. Component Hierarchy

```
ContestWorkspace (self-contained container)
├── ContestHeader (Sprint 1) + "Open Workspace"
├── ContestWorkspaceSummary (solved/acceptance/penalty + Quick Notes)
├── ContestPerformanceCard → ContestMetricCard grid
├── main: ContestProblemTable (sort/filter) + WorkspaceProblemForm · ContestStatisticsGrid
└── rail: ContestWorkspaceSidebar · ContestTimeline → TimelineEvent · WorkspaceEventForm

Badges: ContestStatusBadge · ContestEventBadge.  Pages (lazy): Workspace ·
Timeline · Performance · Problem Breakdown — all reuse the Contest Detail /
analytics chart components.
```

React Query owns workspace/timeline/performance data (keyed per contest, all
invalidated together on mutation); Redux holds UI only (selected problem,
timeline/status filters).

---

## 8. The Contest Workspace & Timeline (description)

The **Workspace** opens from a contest's detail via **Open Workspace**. It shows
the contest header, a summary line (solved/total · acceptance · penalty) beside
quick notes, an 8-tile performance grid (solved · wrong · penalty · success rate
· avg/fastest/slowest solve · duration), then a two-column body: a sortable,
status-filterable **problem table** (# · Problem · Difficulty · Attempts · Solve
Time · Penalty · Status) with an inline add-problem form and a derived
**statistics** grid (acceptance · attempted · skipped · avg attempts · efficiency
· pace); and a rail with a performance glance, section nav, a dimmed
**Postmortem / Upsolve** placeholder, and the **timeline**. The **Timeline** is a
railed, chronological list — a coloured dot per event, the contest-clock offset
(`00:00`, `00:19`, `01:32`), the event label and detail (e.g. *Opened A → Wrong
Answer → Accepted A → …→ Contest Finished*) — with an inline "log event" form.
Dedicated Timeline / Performance / Problem-Breakdown pages surface each section
full-width. Dark-theme, responsive, with skeletons and empty states throughout.

---

## 9. Extension Points for Sprint 3 (Postmortem & Upsolve)

- **Contest Detail** already reserves dimmed **Postmortem / Upsolve** cards, and
  the sidebar reserves an Upsolve slot — Sprint 3 fills them in place.
- **ContestProblem** carries everything an upsolve queue needs (solved/attempted/
  skipped + timing); an upsolve list filters `!solved`.
- **The timeline + performance cache** are the raw material a postmortem
  summarises; no schema change required.
- **Activity vocabulary** already includes the contest events a postmortem/upsolve
  feed will reference.
- Workspace routes/components are additive, so Sprint 3 pages slot in with no
  refactor.

---

## Verification

- **Backend** `tsc` → clean; **frontend** `tsc` + `vite build` → clean (workspace
  pages code-split; main bundle ~849 KB).
- **Smoke** (`npm run test:smoke`) → `✅ ALL ASSERTIONS PASSED`, incl. problem
  create (derived status/penalty), duplicate `409`, mark-solved update recomputing
  performance, timeline events + offsets, workspace aggregation
  (`problems=3 solved=2 penalty=95 avgSolve=18 fastest=5 accept=100%`), the three
  contest-workspace activity events, delete re-aggregation, and HTTP `201/200/400`
  coverage for every workspace endpoint.
