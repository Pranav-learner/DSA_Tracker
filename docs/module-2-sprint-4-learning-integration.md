# Module 2 · Sprint 4 — Learning Integration Engine & Problem Workspace

Connects everything. The Problem Detail page is now the learner's **integrated
workspace**, and solving a problem automatically flows through the whole system:

```
Problem → Attempt History → Knowledge Entry → Topic Progress → Mastery
        → Dashboard → Recommendation
```

All orchestration lives in services (never controllers); Module 1 is **reused, not
rewritten**. Out of scope by design (later modules): spaced repetition, revision
scheduling, contest analytics, AI mentor, advanced analytics.

---

## 1. Updated Architecture

`＋` new · `~` extended.

```
backend/src/
├── services/
│   ├── learningIntegration.service.ts   ＋ THE orchestrator (applyLearningImpact / impact / status)
│   ├── workspace.service.ts             ＋ workspace aggregation + completeProblem
│   ├── workspace.dto.ts                 ＋ Workspace / LearningSummary / LearningImpact DTOs
│   ├── attempt.service.ts               ~ problem-level first-solve detection
│   └── attemptIntegration.ts            ~ first-solve → learningIntegration (was a placeholder)
├── validators/problemComplete.validator.ts  ＋
├── controllers/workspace.controller.ts      ＋ workspace / complete / learning-impact
├── repositories/problem.repository.ts   ~ + findRelated()
├── routes/problem.routes.ts             ~ + /:id/workspace, /:id/complete, /:id/learning-impact
├── types/domain.ts                      ~ recommendation-updated + PROBLEM_LEARNING_STATUSES
└── tests/roadmap.integration.ts         ~ integration-flow + HTTP assertions

frontend/src/
├── api/problem.api.ts                   ~ workspace / complete / learningImpact
├── hooks/useWorkspace.ts                ＋ useProblemWorkspace / useCompleteProblem / useLearningImpact
├── lib/invalidate.ts                    ＋ shared invalidateProblemLearning() (sync point)
├── hooks/useAttempts.ts / useNotebook.ts  ~ route mutations through the shared invalidator
├── components/workspace/                ＋ the workspace component set (10)
├── components/problems/ProblemStatusBadge.tsx  ~ 5-state (Learning/Attempting/Mastered)
├── components/attempts/AttemptSummaryCard.tsx  ~ optional `summary` prop (no duplicate fetch)
├── components/dashboard/ActivityTimeline.tsx   ~ recommendation-updated icon
├── pages/ProblemDetailPage.tsx          ~ redesigned into the Problem Workspace
└── types / queryClient                  ~ workspace + learning-impact types & keys
```

Reused throughout (no duplication): `topicProgressService.applyUpdate` (Module 1
mastery engine), `progressService`, `recommendationService`, `unlockService`,
`problemService`, `attemptService`, `notebookRepository`, `activityService`, and
on the client `ProblemHeader`, `AttemptSummaryCard`, `AttemptHistory`,
`RelatedProblemCard`, `LearningRecommendationCard`, `ActivityTimeline`,
`DashboardMetricCard`, `MasteryBar`, `ConfidenceSlider`.

---

## 2. Integration Flow

```
Solve (via QuickActionBar "Mark Solved"  OR  logging a Solved attempt)
   │
   ▼  POST /problems/:id/complete            (records a Solved attempt)
attemptService.create → syncUserProblem → detects problem-level FIRST solve
   │
   ▼  attemptIntegration.onProblemSolved (first solve only)
learningIntegrationService.applyLearningImpact(userId, problem)
   ├─ read overview (before) + recommendation (before)
   ├─ if topic unlocked:
   │     topicProgressService.applyUpdate(topicId, difficulty-scaled metric patch)
   │        → recomputes mastery + status  (Update Topic Progress / Mastery)
   │        → advances LearningState pointer (Update Current Topic)
   │        → records topic-progress activity (started / completed / mastered)
   ├─ read overview (after) + recommendation (after)
   ├─ if recommendation changed → record 'recommendation-updated'
   └─ return before/after LearningImpact
   │
   ▼  React Query invalidateProblemLearning()
Dashboard · Progress · Recommendation · Workspace · Library — all refresh (no reload)
```

The mastery bump is **bounded and idempotent per problem**: only the first solve
applies a signal, so upsolves and duplicate completions never double-count.

---

## 3. Updated API Documentation

Standard `{ success, data }` envelope; user via `currentUserId`; controllers only
parse + delegate.

| Method & path | Purpose |
|---|---|
| `GET /api/problems/:id/workspace` | The whole workspace: `problem`, `attemptSummary`, `notebook` (lite ref or null), `learningStatus` (5-state), `learningSummary`, `learningImpact`, `relatedProblems`, `activity`. |
| `POST /api/problems/:id/complete` | Trigger the integration flow. Body (all optional): `{ language, durationMinutes, notes }`. Records a Solved attempt and returns the before/after `LearningImpact`. **Idempotent** — an already-solved problem returns `alreadyCompleted: true` with no side effects. `404` if missing. |
| `GET /api/problems/:id/learning-impact` | Read-only impact snapshot: `currentMastery`, `topicProgress`, `dashboard`, `recommendation`. |

`LearningImpact`: `{ currentMastery, masteryBefore, masteryDelta, topicCompleted,
topicProgress, dashboard{overallMastery,completionPercent,topicsCompleted,
topicsRemaining}, recommendation, alreadyCompleted? }`.

---

## 4. LearningIntegrationService

The single orchestrator (all business logic; nothing in controllers):

- **`applyLearningImpact(userId, problem)`** — the solve reaction. Translates a
  solve into a difficulty-scaled, clamped mastery signal and runs it through
  Module 1's `topicProgressService.applyUpdate` (which recomputes mastery/status,
  advances the pointer and logs topic activity). Detects and logs recommendation
  changes; returns the before/after impact. Locked topics are skipped gracefully.
- **`getLearningImpact(userId, problemId)`** — read-only impact snapshot.
- **`buildImpact(overview, …)`** — pure builder from an already-loaded overview.
- **`deriveLearningStatus(attempts, notebook)`** — the 5-state workspace status
  (Not Started → Learning → Attempting → Solved → **Mastered**). "Mastered"
  requires **Solved + a notebook with the required metadata** (validation rule).

Wiring: `attemptIntegration` (Sprint 2's seam) now calls `applyLearningImpact` on
a problem's first solve instead of the old no-op placeholder, so **every** solve
path — the quick "Mark Solved" and logging a Solved attempt — runs the full chain.
`workspaceService.completeProblem` reuses `attemptService` to record the solve
(so the chain fires once) and reports the delta. No import cycles: `attemptService
→ attemptIntegration → learningIntegration → (Module 1 services)`; `workspaceService`
sits above both and nothing imports it but its controller.

---

## 5. Synchronization Strategy

One shared client helper, `invalidateProblemLearning(problemId)`, is the single
sync point used by **completion, attempt and notebook** mutations. It invalidates
only the affected queries — the problem's workspace / detail / attempts / summary /
notebook-by-problem, the library list + notebook index, and the Module 1 dashboard /
progress / learningState / recommendation — never a blanket refetch. Because the
backend recomputes UserProblem, TopicProgress and all aggregates from source (no
stored duplicates), and the client re-reads exactly those queries, every collection
stays consistent without a page reload. The workspace endpoint aggregates in one
request; `AttemptSummaryCard` accepts the payload's summary (no duplicate fetch),
and only the attempt **history** is a second, legitimate request.

---

## 6. Component Hierarchy

```
ProblemDetailPage (useProblemWorkspace — one request)
└── ProblemWorkspace
    ├── WorkspaceHeader
    │   ├── ProblemHeader (reused)
    │   └── QuickActionBar ── Mark Solved (useCompleteProblem) · Document · status
    ├── main column
    │   ├── LearningImpactCard ── mastery + delta + dashboard tiles (DashboardMetricCard)
    │   ├── AttemptSummaryCard (reused, fed from payload)
    │   ├── AttemptHistory (reused — log/edit/delete; solving here also integrates)
    │   ├── KnowledgeNotebookCard ── open / document (from payload)
    │   ├── Related Problems (RelatedProblemCard grid, reused)
    │   └── ActivityPanel (reuses dashboard ActivityTimeline)
    └── WorkspaceSidebar
        ├── LearningSummaryCard ── topic/phase/pattern/mastery/confidence/status/rec
        ├── RecommendationPanel (reuses LearningRecommendationCard)
        └── IntegrationStatusCard ── the connected-system checklist
```

State: server state in React Query; the only UI state (the attempt modal) is local
to `AttemptHistory`, so **no workspace Redux slice was added** — honouring "avoid
unnecessary global state."

---

## 7. Problem Workspace (described)

A premium, Linear-inspired two-column workspace. The header reuses `ProblemHeader`
(identity, difficulty, platform, links) with a QuickActionBar beneath: the live
5-state status badge, a one-click **Mark Solved** (runs the integration and, on
success, the whole page refreshes — impact, status, dashboard), and **Document**.
The main column leads with the **Learning Impact** card (topic mastery bar, a
"+N% mastery" pulse on a fresh solve, and overall/topics tiles), then the reused
Attempt Summary + Attempt Timeline, the Knowledge Notebook entry (confidence peek +
metadata status), Related Problems, and the Activity Timeline (newest first:
started → solved → documented → mastery increased → topic completed → recommendation
changed). The right rail carries the **Learning Summary** (topic, phase, pattern,
topic mastery, confidence, status, next action), the **Recommendation Panel**, and
an **Integration Status** checklist that visibly ticks off attempts → solved →
documented → topic progress → dashboard synced. Dark, glass cards, framer motion,
skeletons, empty/error states, responsive (columns stack on mobile).

---

## 8. Extension Points Prepared for Module 3 (Revision Engine)

- **`learningIntegrationService`** is the single seam for solve-driven effects —
  Module 3 hooks revision scheduling in here (it already has topic/mastery/
  recommendation context) with no controller or Module 1 changes.
- **`invalidateProblemLearning`** centralises sync; a revision queue query slots in
  by adding one key.
- **Activity `recommendation-updated`** + the full event set feed any future
  timeline/analytics consumer.
- **`LearningImpactDTO` / `WorkspaceDTO`** already expose mastery deltas and topic
  progress — the inputs a revision/analytics engine needs, no schema change.
- The **5-state `deriveLearningStatus`** and the metric-patch policy are isolated,
  swappable functions — a real mastery/revision model replaces them in place.
- Reusable workspace component set (impact, summary, integration-status, panels)
  is ready to host revision cards.

---

## Verification

- Backend `tsc` ✓ · Frontend `tsc` ✓ · `vite build` ✓
- Integration smoke test (`npm run test:smoke`, in-memory Mongo) — **all assertions
  pass**, including: completing a problem in an unlocked topic **raises topic
  mastery** (0 → 8, delta 8) and updates the dashboard aggregate; UserProblem
  synced solved via completion; **idempotent** duplicate completion (no double
  bump); Solved-without-notebook → `Solved`, Solved+documented+metadata →
  `Mastered`; workspace aggregation (problem + summary + related excluding self +
  activity + learning summary); read-only impact snapshot; problem + topic-progress
  activity events; and the HTTP surface (`workspace` 200, `complete` 200,
  duplicate-complete 200, `learning-impact` 200, invalid id 400, missing 404).
- No local MongoDB was running, so `npm run seed` / the live app weren't executed
  here; the whole integration flow is exercised end-to-end by the in-memory smoke run.
