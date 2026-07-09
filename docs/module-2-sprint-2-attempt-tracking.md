# Module 2 · Sprint 2 — Attempt Tracking Engine

Records the learner's **complete problem-solving journey**, not just "solved". Every
problem now owns an ordered, permanent history of attempts (Wrong Answer → TLE →
Solved …); aggregates on `UserProblem` are recomputed from that history and can
never drift. Solving a problem emits Activity events onto the Module 1 dashboard.

Out of scope by design (later sprints): Pattern Notebook, Mistake Analysis,
Confidence, AI feedback, Revision, Analytics. A **mastery placeholder hook** exists
but computes nothing yet.

---

## 1. Updated Folder Structure

`＋` new · `~` extended.

```
backend/src/
├── models/
│   ├── Attempt.ts                    ＋ immutable attempt history (soft-deletable)
│   └── UserProblem.ts                ~ + attempt-derived aggregates
├── repositories/
│   └── attempt.repository.ts         ＋ create / history / maxNumber / update / soft-delete
├── services/
│   ├── attempt.service.ts            ＋ CRUD + summary + UserProblem sync (business logic)
│   ├── attempt.dto.ts                ＋ AttemptDTO + AttemptSummaryDTO
│   ├── attemptIntegration.ts         ＋ modular seam: activity + dashboard + mastery hook
│   └── masteryHooks.ts               ＋ placeholder (no mastery computed this sprint)
├── validators/
│   └── attempt.validator.ts          ＋ zod create/update (+ time-order, ownership done in service)
├── controllers/
│   └── attempt.controller.ts         ＋ POST/GET/PATCH/DELETE + problem-scoped history/summary
├── routes/
│   ├── attempt.routes.ts             ＋ /api/attempts
│   ├── problem.routes.ts             ~ + /:id/attempts, /:id/summary
│   └── index.ts                      ~ mounts /attempts + endpoint docs
├── types/domain.ts                   ~ ATTEMPT_STATUSES/VERDICTS/LANGUAGES + activity types
└── tests/roadmap.integration.ts      ~ full attempt lifecycle + HTTP assertions

frontend/src/
├── api/attempt.api.ts                ＋ list / summary / getById / create / update / remove
├── hooks/useAttempts.ts              ＋ queries + create/update/delete mutations (+ invalidation)
├── lib/attempts.ts                   ＋ enums, badge variants, duration/date formatters
├── components/
│   ├── common/Modal.tsx              ＋ reusable portal modal (Escape + scroll lock)
│   └── attempts/                     ＋ the attempt component set
│       ├── AttemptTimeline.tsx  AttemptCard.tsx  AttemptHistory.tsx
│       ├── AttemptSummaryCard.tsx  AttemptStatistics.tsx  TimeSpentCard.tsx
│       ├── AttemptForm.tsx (RHF + Zod)  VerdictBadge.tsx  LanguageBadge.tsx  StatusChip.tsx
│       └── index.ts
├── pages/ProblemDetailPage.tsx       ~ real Attempt summary + history (placeholders trimmed)
├── components/dashboard/ActivityTimeline.tsx  ~ icons for the 3 new event types
├── lib/queryClient.ts                ~ attempts / attemptSummary query keys
└── types/index.ts                    ~ Attempt* types + activity type/entity unions
```

New deps: `react-hook-form`, `zod`, `@hookform/resolvers` (frontend). Reused
throughout: `CardContainer`, `Badge`, `Button`, `EmptyState`, `ErrorState`,
`Skeleton`, `DashboardMetricCard`, `activityService`, `learningRepository`,
`problemRepository`, `userProblemRepository`, `assertObjectId`, `ApiResponse`.

---

## 2. MongoDB Schema

### Attempt (new, immutable history)

| Field | Type | Notes |
|-------|------|-------|
| userId | string | indexed |
| problemId | ObjectId → Problem | indexed |
| attemptNumber | number | 1-based, monotonic per (user, problem) |
| status | enum(Started, Solved, Abandoned) | |
| verdict | enum(Accepted, Wrong Answer, TLE, MLE, RE, CE, Unknown) | |
| language | enum(C++, C, Python, Java, JavaScript, TypeScript, Go, Rust, Kotlin, C#, Other) | |
| startTime | Date | |
| endTime | Date \| null | |
| durationMinutes | number | explicit, else derived from times |
| wrongAttempts | number | |
| usedHint / usedEditorial | boolean | |
| contestAttempt / upsolved | boolean | |
| notes | string | |
| deletedAt | Date \| null | soft-delete marker |
| createdAt / updatedAt | Date | timestamps |

Indexes: `{ userId, problemId, createdAt: -1 }` (history), `{ createdAt: -1 }`,
plus single-field `userId`, `problemId`.

### UserProblem (extended)

Sprint 1 fields (`status`, `favorite`, `lastViewed`) **plus** attempt-derived
aggregates, recomputed by the service (never hand-set):

`totalAttempts`, `firstSolvedAt`, `latestAttemptAt`, `totalTimeSpent` (minutes),
`solved`, `solvedWithoutHint`, `solvedWithoutEditorial`.

---

## 3. API Documentation

Standard `{ success, data }` envelope; user via `currentUserId`. Ownership enforced
in the service (403 on mismatch).

| Method & path | Purpose | Notes |
|---|---|---|
| `POST /api/attempts` | Create an attempt | body validated by zod; `201`; auto `attemptNumber`; syncs UserProblem; fires activity |
| `GET /api/problems/:problemId/attempts` | Attempt history | newest first; excludes soft-deleted |
| `GET /api/problems/:problemId/summary` | Aggregated stats | totals, solved, time, hint/editorial usage, latest attempt |
| `GET /api/attempts/:attemptId` | Single attempt | owner only; `404` if missing/deleted |
| `PATCH /api/attempts/:attemptId` | Update / **complete** an attempt | partial body; recomputes duration + resyncs |
| `DELETE /api/attempts/:attemptId` | Soft delete | history preserved; aggregates resync; `{ id, deleted: true }` |

**Validation** (centralised): `startTime < endTime`, `durationMinutes ≥ 0`,
`wrongAttempts ≥ 0`, enum-checked `status` / `verdict` / `language`, problem
existence (`404`), user ownership (`403`). Unknown body keys are rejected; a
PATCH must include at least one field.

**Summary shape**: `totalAttempts, solved, solvedCount, firstSolvedAt,
latestAttemptAt, totalTimeSpent, averageSolveTime, hintUsageCount,
editorialUsageCount, solvedWithoutHint, solvedWithoutEditorial, latestAttempt`.

---

## 4. Attempt Lifecycle

```
POST /attempts (Started, Wrong Answer, 18m)      → Attempt #1
   → syncUserProblem  (status In Progress, totalAttempts 1, solved false)
   → activity: attempt-started
POST /attempts (Started, TLE, 12m)               → Attempt #2
POST /attempts (Solved, Accepted, 9m)            → Attempt #3
   → syncUserProblem  (status Solved, solved true, firstSolvedAt set,
                       totalTimeSpent 39, solvedWithoutHint true)
   → activity: attempt-started + problem-solved
   → LearningState.lastActiveAt touched (dashboard current activity)
   → masteryHooks.onProblemSolved (placeholder no-op)
PATCH /attempts/:id (status → Solved/Abandoned)  = "complete" path (no separate endpoint)
DELETE /attempts/:id  → soft delete → aggregates recomputed from remaining history
```

`attemptNumber` uses the max ever seen (including deleted) + 1, so numbers never
repeat. Every create/update/delete calls `syncUserProblem`, which **recomputes**
all aggregates from the live (non-deleted) attempts — a single source of truth,
mirroring Module 1's "derive, never store twice" philosophy.

---

## 5. Service Architecture

```
controller → AttemptService (all business logic) → repositories → models
                    │
                    ├── syncUserProblem()     (recompute aggregates → UserProblem)
                    └── attemptIntegration    (modular cross-module side-effects)
                             ├── activityService.record   → dashboard timeline
                             ├── learningRepository.upsert → dashboard current activity
                             └── masteryHooks.onProblemSolved → placeholder (no mastery)
```

- **AttemptService** owns creation/update/complete/soft-delete, numbering,
  duration resolution, time-order + ownership checks, history, summary, and the
  UserProblem sync. Repositories only touch Mongo.
- **AttemptIntegration** is the modular seam so the service stays free of
  cross-module concerns; all effects are best-effort (activity logging swallows
  errors) and never break the core write.
- **masteryHooks** is the documented placeholder where a later sprint wires
  solved-problem → mastery signals; today it is a no-op.

---

## 6. Integration Points with Module 1

- **UserProblem** — kept synchronised on every attempt change (status flips to
  Solved/In Progress; `favorite` and other Sprint-1 state preserved).
- **Dashboard timeline** — `attempt-started`, `attempt-updated`, `problem-solved`
  Activity events (entityType `problem`) flow into the existing Module 1
  `ActivityTimeline` (new icons added).
- **Dashboard current activity** — `LearningState.lastActiveAt` is touched on solve.
- **Topic Progress / Mastery** — reached only through `masteryHooks` (placeholder),
  so no mastery is calculated yet, exactly as required.
- **Problem Library** — a problem's `status`/`solved` overlay now reflects real
  attempts; the list and detail refresh via React Query invalidation.

---

## 7. Screens (described)

**Problem Detail page** now shows, under the header:
- **Attempt Summary** (`AttemptSummaryCard`) — auto-updating: a 4-tile stat grid
  (Total Attempts, Solved, Hints Used, Editorial Used), a Time card (Total Time
  Spent + Average Solve Time), and First Solved / Latest Attempt. Empty-state copy
  before any attempts.
- **Attempt History** (`AttemptHistory`) — a "Log attempt" button and a newest-first
  timeline of `AttemptCard`s. Each card shows Attempt #, status chip, verdict badge,
  Contest/Practice badge, upsolved badge, duration and timestamp, with a quick-facts
  row (wrong count, hint, editorial). Expanding reveals language, notes, start/end,
  duration, mode — plus Edit / Delete.
- **Attempt Form** (`AttemptForm`) — a modal built with React Hook Form + Zod:
  Status, Verdict, Language, Start/End time, Wrong attempts, Hint/Editorial used,
  Contest, Upsolved, Notes. Inline field errors + a server-error banner; used for
  both create and edit.
- The remaining workspace cards (Notebook, Mistakes, Confidence) stay as
  "Coming soon" placeholders.

All dark-theme, glass cards, framer motion (card entrance, modal spring), skeleton
loading, empty/error states, responsive grids.

---

## 8. Extension Points Prepared for Sprint 3 (Pattern Notebook)

- **Attempt notes** already capture free-form insight per attempt — the Notebook
  can aggregate/curate these without a schema change.
- **`masteryHooks.onProblemSolved`** is the wired seam for turning solves into
  mastery signals (Sprint 3+), with `{ problemId, topicId, phaseId }` in hand.
- **`attemptIntegration`** is the single place to add new cross-module effects
  (revision scheduling, confidence prompts) — the service stays untouched.
- **Activity `entityType: 'problem'`** + the new event types are live end-to-end,
  ready for any future consumer.
- **`AttemptSummaryDTO` / aggregates** on UserProblem give downstream engines
  (analytics, revision) their inputs already computed.
- Reusable **Modal**, **VerdictBadge/LanguageBadge/StatusChip**, and the
  RHF+Zod form pattern are ready to host Notebook/Mistake/Confidence UIs.

---

## Verification

- Backend `tsc` ✓ · Frontend `tsc` ✓ · `vite build` ✓
- Integration smoke test (`npm run test:smoke`, in-memory Mongo) — **all assertions
  pass**, including the WA→TLE→Solved journey (#1/#2/#3, durations derived +
  explicit), UserProblem sync (solved, status, totalAttempts 3, totalTimeSpent 39,
  solvedWithoutHint, **favorite preserved**), summary (avg 9m, hints 1, latest #3),
  update, soft-delete recompute (2 attempts / 27m), deleted-attempt not
  retrievable, `startTime < endTime` rejection, activity-event generation, and the
  HTTP surface (`POST` 201; history/summary/get/patch/delete 200; invalid times
  400; missing problem 404).
- No local MongoDB was running, so `npm run seed` / live app weren't executed here;
  the engine is exercised end-to-end by the in-memory smoke run.
