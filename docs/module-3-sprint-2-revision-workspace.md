# Module 3 · Sprint 2 — Revision Workspace & Active Review Sessions

A distraction-free study environment where the learner actually performs
revisions. Introduces **Revision Sessions** (start / pause / resume / complete /
abandon) with a live timer, a **Quick Review** mode, permanent **session
history**, and a dashboard active-session widget. Completing a session advances
its schedule via the Sprint-1 strategy.

Implements: `Today's Queue → Open Revision → Review Knowledge → Complete Session →
Store History → (ready for the Retention Engine)`. Out of scope (Sprint 3):
confidence decay, retention scoring, mastery updates, AI coaching, adaptive
scheduling. Confidence is **stored only**.

---

## 1. Updated Folder Structure

`＋` new · `~` extended.

```
backend/src/
├── models/RevisionSession.ts              ＋ active-review sessions
├── repositories/revisionSession.repository.ts ＋
├── services/
│   ├── revisionSession.service.ts         ＋ lifecycle + history + dashboard (business logic)
│   ├── revisionSession.dto.ts             ＋ session / content / workspace DTOs
│   ├── revisionWorkspace.service.ts       ＋ content aggregation (reuses Module 2)
│   ├── revision.dto.ts                    ~ DashboardRevisionQueueDTO (rename)
│   ├── revisionQueue.service.ts           ~ returns the queue part
│   ├── dashboard.service.ts / dashboard.dto.ts ~ merges queue + session widget
├── validators/revisionSession.validator.ts ＋
├── controllers/revisionSession.controller.ts ＋
├── routes/revision.routes.ts + index.ts   ~ + /workspace, /session/*, /history
├── types/domain.ts                        ~ session statuses + activity types
├── seed/seed.ts                           ~ seedRevisionSessions()
└── tests/roadmap.integration.ts           ~ session lifecycle + workspace + HTTP

frontend/src/
├── api/revisionSession.api.ts             ＋
├── hooks/useRevisionSession.ts            ＋ workspace / active / history + mutations
├── store/slices/revisionSlice.ts          ~ timer / mode / collapsed panels / history filters
├── lib/revision.ts                        ~ session-status meta, formatClock, workspace links
├── components/revision/                   ＋ 13 workspace/session components (+ RevisionPanel helper)
├── pages/
│   ├── RevisionWorkspacePage.tsx          ＋ the active-review workspace
│   ├── RevisionHistoryPage.tsx            ＋ filterable history
│   └── RevisionPage.tsx                   ~ links to the workspace + history
├── components/revision/DueTodayWidget.tsx ~ active session / done-today / resume / recent
├── router.tsx                             ~ /revision/session, /revision/history
└── types / queryClient                    ~ session types & keys
```

Reused (no duplication): the whole Module 2 knowledge stack (`notebookService`,
`topicService`, `problemService`), the Sprint-1 `revisionScheduleService` (schedule
advance on complete), `Modal`, `ComplexityCard`, `ConfidenceSlider`, `KeywordChip`,
`DashboardMetricCard`, `Pagination`, `DifficultyBadge`, `PlatformBadge`, and the
dashboard aggregation.

---

## 2. MongoDB Schema — RevisionSession

| Field | Type | Notes |
|-------|------|-------|
| userId | string | indexed |
| revisionScheduleId | ObjectId → RevisionSchedule \| null | indexed |
| entityType | enum(topic, pattern, knowledgeEntry) | |
| entityId | string | |
| title | string | |
| sessionStatus | enum(Started, Completed, Abandoned) | |
| startedAt | Date | indexed |
| completedAt | Date \| null | |
| durationMinutes | number | client-tracked (pauses excluded) or derived |
| reviewedKnowledgeEntries | string[] | id refs |
| reviewedProblems | string[] | id refs |
| reviewNotes | string | |
| selfConfidenceBefore / After | number \| null | **stored only — no scoring** |
| createdAt / updatedAt | Date | timestamps |

Indexes: `{userId, startedAt}`, `{userId, sessionStatus}`, `{userId, entityId,
startedAt}`. **Knowledge is not copied here** — the workspace resolves it live from
Module 2, so there's zero duplicate storage.

---

## 3. API Documentation

Standard `{ success, data }` envelope; user via `currentUserId`; controllers only
parse + delegate.

| Method & path | Purpose |
|---|---|
| `GET /api/revision/workspace?scheduleId=` or `?entityType=&entityId=` | Knowledge **content** (composed from Module 2) + the active session + owning schedule. |
| `POST /api/revision/session/start` | Begin a session (a scheduleId OR an entity). `409` if one is already active. |
| `POST /api/revision/session/complete` | Finish a session; stores duration/notes/confidence/refs and **advances the schedule**. |
| `PATCH /api/revision/session/:id` | Update notes / confidence / reviewed refs, or `action: pause · resume · abandon`. |
| `GET /api/revision/session/active` | The current active session, or `null`. |
| `GET /api/revision/session/:id` | One session. |
| `GET /api/revision/history` | Paginated, filterable history (status / entityType / date / sort recent·oldest·duration). |
| `GET /api/revision/history/:entityId` | All sessions for one entity. |

**Validation:** one active session per user, schedule ownership, valid entity
references, a session cannot be completed without being active (Started).

---

## 4. RevisionSession Architecture

```
controller → RevisionSessionService (lifecycle)          RevisionWorkspaceService (content)
      │                                                        │  composes Module 2:
      ├─ start: dedup active → resolve entity → create        ├─ knowledgeEntry → notebookService.getById + topic concept
      │         → activity 'revision-started'                 ├─ topic → topicService.getById + problemService.list
      ├─ update: notes/confidence/refs + pause/resume/abandon ├─ pattern → problemService.list + a matching notebook
      │         → activity paused/resumed/notes-updated       └─ → RevisionContentDTO (recognition/coreIdea/coreAlgorithm/
      ├─ complete: store values → activity 'revision-completed'    whenToUse/mistakes/contestTraps/alternatives/problems/notes)
      │         → revisionScheduleService.recalculate (advance next review)
      └─ history / active / dashboard summary
```

**Reuse, not duplication:** the workspace never stores knowledge — `commonMistakes`
come from the notebook, `contestTraps` from the topic's limitations, representative
problems from the **problem library** (navigable ids), etc. `RevisionSessionService`
holds all business logic; repositories do DB access; the schedule advance reuses
Sprint 1. No import cycles: `session → schedule`, `workspace → {notebook, topic,
problem, session, schedule}`, and nothing imports the workspace but its controller.

---

## 5. Session Lifecycle

```
Start ─▶ Started (timer running, activity: revision-started)
  │        │
  │        ├─ Pause  → timer stops (activity: revision-paused)   ── Resume ─▶ timer runs (revision-resumed)
  │        ├─ Notes/confidence/reviewed-refs → PATCH (revision-notes-updated)
  │        ├─ Abandon → Abandoned (activity, timer reset)
  │        └─ Complete → Completed
  │                       ├─ store duration + notes + confidence + reviewed refs
  │                       ├─ activity: revision-completed
  │                       └─ revisionScheduleService.recalculate → next review scheduled
  ▼
Summary modal (duration / entries / problems / notes / confidence before·after)
```

The timer is Redux-driven (ticks each second while running) so elapsed time
survives panel re-renders and pauses. Duration on complete = elapsed active
minutes (client), falling back to `completedAt − startedAt`.

---

## 6. Component Hierarchy

```
RevisionWorkspacePage (useRevisionWorkspace — one request)
└── RevisionWorkspace  (owns session mutations + Redux timer)
    ├── RevisionHeader ── title · entity chip · status · Full ↔ Quick toggle
    ├── control bar: RevisionTimer + RevisionSessionControls (start/pause/resume/complete/abandon)
    ├── Quick mode → QuickReviewCard  (keywords · core algorithm · top mistakes · 1 problem · confidence)
    └── Full mode:
        ├── RecognitionKeywordPanel · KnowledgeSummaryCard×N (core idea/algorithm/when-to-use/notes)
        ├── ComplexityCard (reused) · MistakeReviewCard · ContestTrapCard
        ├── Representative + Related Problems (RepresentativeProblemCard) · Alternative Approaches
        └── sidebar: Quick Notes (textarea) + Confidence (ConfidenceSlider, stored only)
    └── RevisionSummaryModal (on completion)

RevisionHistoryPage → filters + RevisionHistoryTable (+ Pagination)
Dashboard → DueTodayWidget (active session · done today · Quick Resume · recent history)
```

All sections use the collapsible `RevisionPanel` (collapse state in Redux — focus
mode). `SessionStatusBadge` and `RevisionTimer` are shared.

---

## 7. Revision Workspace & History (described)

**Workspace** (`/revision/session?scheduleId=…`) — a Linear-inspired, distraction-
free study screen. The header carries the title, entity chip, live status and a
Full ↔ Quick toggle. A control bar shows the running timer and the session controls.
In **Full** mode the main column presents the reused knowledge — recognition
keywords, core idea, core algorithm, when-to-use / when-not-to-use, complexities,
common mistakes, contest traps, representative + related problems, and alternative
approaches — each a collapsible panel; the sidebar has Quick Notes (auto-saved) and
a confidence slider (stored, not scored). **Quick** mode collapses everything into a
single 2–3 minute refresh card. Completing opens a summary modal (duration,
entries/problems reviewed, notes, confidence before/after). If a session is active
for another entity, a banner blocks starting a second one.

**History** (`/revision/history`) — a filterable table (Date · Topic · Type ·
Duration · Status · Notes) with Status / Type / Sort (Newest·Oldest·Duration)
filters and pagination.

**Dashboard** — the revision widget now shows the active session with **Quick
Resume**, today's completed count, and recent revisions, alongside the queue.

All dark-theme, glass, animated, with skeletons and empty/error states.

---

## 8. Integration Points for Sprint 3 (Retention Engine)

- **Every session is a measured record** — duration, reviewed refs, confidence
  before/after are stored; the Retention Engine computes decay/scores from this
  history with no schema change.
- **`revisionScheduleService.recalculate`** is already the completion hook — a
  retention model swaps the strategy (SM-2/AI) to set the next interval; `easeFactor`
  is persisted for it.
- **`revisionSession.dto` / history endpoints** expose the full session stream any
  retention/analytics engine needs.
- **Activity events** (started/paused/resumed/completed/notes) are live end-to-end.
- **RevisionWorkspaceService.getContent** is the single content seam — AI coaching
  or adaptive emphasis layers on top without touching storage.
- Reusable component set (workspace panels, timer, controls, history table) is ready
  to host retention insights.

---

## Verification

- Backend `tsc` ✓ · Frontend `tsc` ✓ · `vite build` ✓
- Integration smoke test (`npm run test:smoke`, in-memory Mongo) — **all assertions
  pass**, including: a session starts from a schedule; **one active session per
  user** (409); the workspace composes knowledge from Module 2 (keywords + 3
  representative problems + 3 contest traps for a knowledge entry; core-idea +
  when-to-use for a topic); pause / resume / notes; **complete stores values and
  advances the schedule** (reviewCount 0→1, next review in the future); a session
  **cannot be completed twice**; abandon; history + per-entity history; the
  dashboard session widget (active / completedToday / recent); the five session
  activity events; and the HTTP surface (start 201, active/get/patch/workspace/
  complete/history 200, restart 201, second-active 409, no-params 400, bad id 400).
- No local MongoDB was running, so `npm run seed` / the live app weren't executed
  here; the full lifecycle is exercised by the in-memory smoke run.
