# Module 3 · Sprint 1 — Revision Scheduler & Daily Revision Queue

Decides **what to revise and when**. Completed topics and knowledge entries are
automatically turned into spaced-review schedules; a daily queue and a monthly
calendar surface them, and the Module 1 dashboard gains a revision widget. The
learner never manually decides what to revise.

Implements: `Learning → Knowledge Entry → Revision Schedule → Daily Queue`.
Out of scope (later sprints): revision sessions, retention/confidence decay,
mastery recalculation, AI scheduling, SM-2 beyond the configurable default.

---

## 1. Updated Folder Structure

`＋` new · `~` extended.

```
backend/src/
├── config/revision.ts                     ＋ intervals, estimates, priorities (configurable)
├── models/RevisionSchedule.ts             ＋ schedule collection
├── repositories/revisionSchedule.repository.ts ＋
├── services/
│   ├── revisionStrategy.ts                ＋ RevisionStrategy interface + DefaultRevisionStrategy + registry
│   ├── revision.util.ts                   ＋ date/status helpers + DTO mapping
│   ├── revision.dto.ts                    ＋ schedule / queue / calendar / dashboard DTOs
│   ├── revisionSchedule.service.ts        ＋ CRUD + ensureSchedule + recalc (business logic)
│   ├── revisionQueue.service.ts           ＋ today's queue + calendar + dashboard summary
│   ├── notebookIntegration.ts             ~ knowledge entry → auto-schedule (hook)
│   ├── learningIntegration.service.ts     ~ topic completed → auto-schedule (hook)
│   ├── dashboard.service.ts / dashboard.dto.ts ~ revision widget (one extra parallel call)
├── validators/revision.validator.ts       ＋
├── controllers/revision.controller.ts      ＋
├── routes/revision.routes.ts + index.ts    ＋/~ mounts /api/revision
├── types/domain.ts                        ~ revision enums + activity types/entity
├── seed/seed.ts                           ~ seedRevision() (schedules + activity)
└── tests/roadmap.integration.ts           ~ revision engine + HTTP assertions

frontend/src/
├── api/revision.api.ts                    ＋
├── hooks/useRevision.ts                   ＋ today / calendar / schedules + mutations
├── store/slices/revisionSlice.ts          ＋ calendar month / selected date / filter (UI state)
├── lib/revision.ts                        ＋ urgency/priority meta, formatters, entity links
├── components/revision/                   ＋ the revision component set (10)
├── pages/RevisionPage.tsx                 ＋ the daily revision hub
├── pages/DashboardPage.tsx                ~ revision widget (DueTodayWidget)
├── components/dashboard/ActivityTimeline.tsx ~ revision activity icons
├── router / Sidebar                       ~ /revision route + live "Revision" nav
└── types / queryClient / store            ~ revision types, keys, slice registration
```

Reused (no duplication): `DashboardMetricCard`, `CardContainer`, `Badge`,
`Button`, `EmptyState`, `ErrorState`, `Skeleton`, `SectionHeader`, `activityService`,
the dashboard aggregation, and the validator/DTO/paginated patterns.

---

## 2. MongoDB Schema — RevisionSchedule

| Field | Type | Notes |
|-------|------|-------|
| userId | string | indexed |
| entityType | enum(topic, pattern, knowledgeEntry) | indexed |
| entityId | string | generic (topic/notebook id, or a pattern key) |
| title | string | denormalised for the queue |
| currentInterval | number | days |
| nextReviewDate | Date | indexed |
| lastReviewDate | Date \| null | |
| reviewCount | number | |
| easeFactor | number | stored now for future SM-2 |
| priority | number (1–5) | |
| status | enum(Pending, Due, Completed, Overdue, Archived) | **only Pending/Completed/Archived are stored**; Due/Overdue are derived |
| strategy | string | strategy name (SM-2/AI plug in) |
| createdAt / updatedAt | Date | timestamps |

Indexes: `userId`, `nextReviewDate`, `status`, `entityType`, compound
`{userId, status, nextReviewDate}` (queue) and `{userId, entityType, entityId}`
(dedup). **Due/Overdue are never persisted** — they're computed from
`nextReviewDate` at read time, so schedules can't drift as the clock moves.

---

## 3. RevisionStrategy Architecture

Scheduling math is behind a pluggable interface (never hardcoded in services):

```ts
interface RevisionStrategy {
  name: string;
  intervals: readonly number[];
  initialSchedule(from): { currentInterval, nextReviewDate, easeFactor };
  nextReview(state, from): { currentInterval, nextReviewDate, easeFactor, reviewCount };
}
```

`DefaultRevisionStrategy` uses expanding intervals **1 → 3 → 7 → 14 → 30 → 60 → 90**
days (from `config/revision.ts`, fully configurable), repeating the last. A
registry (`getRevisionStrategy(name)` / `registerRevisionStrategy`) resolves a
strategy by the name stored on each schedule, so **SM-2 / AI strategies plug in
with no schema change** — the `easeFactor` field is already persisted for them.

---

## 4. API Documentation

Standard `{ success, data }` envelope; user via `currentUserId`; controllers only
parse + delegate.

| Method & path | Purpose |
|---|---|
| `POST /api/revision/schedules` | Create a schedule. `409` on a duplicate active entity (unless `allowDuplicate`). Uses the strategy's initial schedule when `nextReviewDate` is omitted. |
| `GET /api/revision/schedules` | Paginated, filterable (`status`, `entityType`, `from`/`to`, sort). |
| `GET /api/revision/schedules/:id` | One schedule. |
| `PATCH /api/revision/schedules/:id` | Update (title / priority / lifecycle status / strategy / nextReviewDate). |
| `DELETE /api/revision/schedules/:id` | Remove. |
| `GET /api/revision/today` | Daily queue: `{ overdue, dueToday, upcoming, summary }`. Summary = due/overdue/upcoming counts, total scheduled, estimated review minutes. |
| `GET /api/revision/calendar?from&to` | Revision events grouped by date (defaults to the current month): `{ from, to, days[] }` with per-day urgency counts + items. |

**Validation:** valid ISO review dates, valid strategy (enum), priority 1–5,
duplicate-entity guard, user ownership (403). Derived `status` filters
(Due/Overdue/Pending) are translated to `nextReviewDate` conditions server-side.

---

## 5. Scheduler Flow

```
Complete a topic (solve-driven)            Document a problem (create notebook)
        │                                          │
learningIntegration.applyLearningImpact     notebookIntegration.onCreated
   (impact.topicCompleted)                   (entry created)
        └──────────────┬───────────────────────────┘
                       ▼
   revisionScheduleService.ensureScheduleFor(userId, {entityType, entityId, title})
        │  (idempotent — no-op if an active schedule already exists)
        ├─ strategy.initialSchedule(now) → currentInterval 1, nextReviewDate +1 day
        ├─ persist (status Pending, priority from config)
        └─ activityService.record('revision-scheduled')  → dashboard timeline
```

Auto-scheduling hooks live entirely in the **Module 2 integration seams** — Module
1 is untouched. Both hooks are best-effort (wrapped) so they never break the write.
A manual `POST /schedules` covers explicit creation. `recalculate()` (advance via
the strategy) is implemented and exposed for the Sprint-2 Revision Workspace.

---

## 6. Queue Generation

`revisionQueueService` reads a user's active schedules **once** and buckets them by
derived urgency:

- **overdue** — `nextReviewDate` before today
- **due today** — `nextReviewDate` is today
- **upcoming** — within the next `UPCOMING_WINDOW_DAYS` (7)

Each bucket is sorted **priority desc, then soonest date**. The summary carries the
counts, total scheduled, and estimated review minutes (`overdue + due`, from
per-entity estimates in config). `getDashboardSummary` reuses the same bucketing
(one query) for the dashboard widget — **no duplicate queries**.

---

## 7. Calendar Implementation

`GET /calendar` loads active schedules in `[from, to]` (a `nextReviewDate` range
query on the indexed field) and groups them by UTC day key (`YYYY-MM-DD`) into
`{ date, overdue, due, upcoming, total, items[] }`. The frontend `RevisionCalendar`
renders a read-only monthly grid: each `CalendarDay` shows the day number plus
coloured urgency dots (danger/warning/primary); month navigation and day selection
are UI state in Redux; the selected day expands its item list. No drag-and-drop.

---

## 8. Revision Dashboard (described)

`/revision` — the daily hub. A `SectionHeader`, then the `QueueSummaryCard` strip
(Due Today / Overdue / Upcoming / Est. Time / Total, as metric cards). A two-column
body: the main column leads with the highlighted **Overdue Reviews** (danger-tinted
`RevisionCard`s), then **Today's Queue** (with an "all caught up" empty state), then
the **Calendar** with a selected-day panel; the right rail (`RevisionSidebar`) shows
**Upcoming** reviews and **Revision Statistics**. Each `RevisionCard` shows the
`PriorityBadge` (Overdue/Due/Upcoming), a `ScheduleChip` (topic/pattern/notebook),
countdown, estimated time and a **Review** action that opens the underlying entity.

**Dashboard widget** — `DueTodayWidget` in the dashboard's right panel: Due Today /
Overdue counts, estimated time, a today's-queue preview and a "Start revision" link
— refreshed automatically via query invalidation. Dark, glass, animated, skeletons
and empty states throughout.

---

## 9. Extension Points Prepared for Sprint 2 (Revision Workspace)

- **`RevisionStrategy` + `recalculate()`** are the seam for reviews: a session
  completes → `recalculate` advances the schedule via the strategy (SM-2/AI just
  register a new strategy — `easeFactor` is already stored).
- **`revisionScheduleService.ensureScheduleFor`** is the single auto-create entry
  point; new triggers add one call.
- **Activity `revision-scheduled` / `revision-due` / `revision-overdue`** are wired
  end-to-end and on the dashboard timeline.
- **Derived status/urgency** (`revision.util`) is isolated — a session/retention
  model layers on without touching storage.
- **Queue + calendar DTOs** already expose everything a Revision Workspace needs
  (per-item estimates, priority, urgency, entity links).
- Reusable component set (`RevisionCard`, `RevisionQueue`, `RevisionCalendar`,
  `DueTodayWidget`, …) is ready to host the session UI.

---

## Verification

- Backend `tsc` ✓ · Frontend `tsc` ✓ · `vite build` ✓
- Integration smoke test (`npm run test:smoke`, in-memory Mongo) — **all assertions
  pass**, including: default strategy schedules the first review in 1 day; past/
  today/future dates derive **Overdue/Due/Upcoming**; **duplicate-entity rejection
  (409)** + idempotent `ensureScheduleFor`; **notebook creation auto-schedules a
  revision**; the daily queue buckets + summary (overdue/due/upcoming, estimated
  minutes); the calendar groups events by date; update, recalculate (advances the
  review), delete; the **dashboard revision widget**; `revision-scheduled` activity;
  and the HTTP surface (`schedules` CRUD, `today`, `calendar` → 200; duplicate →
  409; invalid id → 400).
- No local MongoDB was running, so `npm run seed` / the live app weren't executed
  here; the whole engine (incl. auto-scheduling + seed builder) is exercised by the
  in-memory smoke run.
