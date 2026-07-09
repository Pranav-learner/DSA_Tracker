# Module 5 · Sprint 3 — Contest Learning Engine (Postmortem, Upsolve & Learning Integration)

Every contest becomes the **beginning of learning, not the end**. On top of the
Sprint-2 workspace, this sprint adds structured **postmortems**, an
auto-generated **upsolve queue**, and — the flagship — an **upsolve completion
that synchronises the existing Learning Engine** (mastery, revision, knowledge)
by reusing Module 1–4 services. No parallel learning logic; no AI.

Out of scope: contest prediction, AI coaching, rating prediction, adaptive
recommendations, ML.

---

## 1. Updated Folder Structure

`＋` new · `~` extended.

```
backend/src/
├── models/ContestPostmortem.ts · UpsolveTask.ts        ＋ 2 collections
├── contests/
│   ├── repositories/contestPostmortem · upsolveTask     ＋ persistence only
│   ├── dto/learning.dto.ts                              ＋ postmortem · upsolve · queue · analysis
│   ├── services/
│   │   ├── postmortem.service.ts       ＋ reflection CRUD + rule-based summary
│   │   ├── upsolve.service.ts          ＋ CRUD + completion SYNC (reuses Learning Engine)
│   │   └── contestLearning.service.ts  ＋ generate upsolve + workspace (reuses Pattern Intelligence)
│   ├── validators/contestLearning.validator.ts          ＋
│   ├── controllers/contestLearning.controller.ts        ＋ postmortem · learning · upsolve
│   └── routes/contest.routes.ts        ~ + learning routes + /api/upsolve router
├── repositories/notebook.repository.ts ~ findFirstByTopic (knowledge link)
├── types/domain.ts                     ~ UPSOLVE_STATUSES/PRIORITIES + 5 activity types
├── services/contest.dto · contest.service ~ pending-upsolve on the dashboard
├── seed/seed.ts                        ~ postmortem + generated upsolve queue
└── tests/roadmap.integration.ts        ~ learning service + HTTP + sync assertions

frontend/src/
├── lib/upsolve.ts                      ＋ status/priority meta
├── api/contest.api.ts · hooks/useContestLearning.ts ＋ postmortem/upsolve hooks
├── store/slices/contestSlice.ts        ~ upsolve filter · reflection editing
├── components/contest/learning/ (11)   ＋ learning component set
├── pages/ContestLearningPage · UpsolveQueuePage ＋
└── router · ContestDetail · workspace sidebar · ContestSummaryCard ~ links + dashboard widget
```

---

## 2. MongoDB Schemas

**ContestPostmortem** (one per contest) — `overallPerformance`, reflection
(markdown) `whatWentWell / whatWentWrong / biggestMistake / biggestLearning /
nextFocus / timeManagementNotes`, analysis lists `strengths / weaknesses /
missedPatterns / implementationMistakes / debuggingMistakes / algorithmGaps`,
`learningGoals[{text, topicId, done}]`, `summary`. Index: unique `contestRef`,
`userId`.

**UpsolveTask** — `{ contestRef, contestProblemRef, userId, topicId, pattern,
priority (high|medium|low), status (Pending|In Progress|Completed|Skipped),
estimatedTime, linkedKnowledgeEntry, linkedRevisionSchedule, denormalised
problem fields, completedAt }`. Indexes: unique `{userId, contestProblemRef}`,
`{userId, status, priority}`.

---

## 3. Contest Learning Architecture

```
Contest → Performance → Reflection → Postmortem → Upsolve → Knowledge → Revision → Mastery
```

`ContestLearningService.getLearning()` composes the workspace: postmortem +
upsolve tasks + **pattern analysis** (contest problems + Module-4 Pattern
Intelligence weaknesses) + algorithm gaps + suggested goals. It generates the
upsolve queue from every unsolved problem (idempotent). Contest-specific logic
stays in the Contest module; it *invents no analytics* — pattern/weakness data
comes from `patternIntelligenceService`.

---

## 4. Postmortem Architecture

`PostmortemService` owns CRUD for the structured reflection (upsert; one per
contest). Markdown is stored verbatim and rendered as pre-wrapped text. The
`summary` is a **rule-based digest** of the key fields (no AI). Saving records a
`contest-reflected` activity (first time) and `learning-goal-created` when goals
grow.

---

## 5. Upsolve Synchronisation Flow

The flagship integration — completing an upsolve **reuses existing services**;
every step is best-effort so completion never fails on a downstream hiccup:

```
PATCH /api/upsolve/:id { status: 'Completed', topicId }
        ▼  UpsolveService.completeTask
  status → Completed, completedAt = now
  if topicId:
    1. Mastery   → topicProgressService.applyUpdate({ standard+8, implementation+8 })   (Module 1)
    2. Revision  → revisionScheduleService.ensureScheduleFor(topic)  → linkedRevisionSchedule (Module 3)
    3. Knowledge → notebookRepository.findFirstByTopic → linkedKnowledgeEntry + activity   (Module 2)
  activity: upsolve-completed  (+ contest-knowledge-added)
```

*Verified in the smoke suite: completing an upsolve moved topic mastery
`86 → 88` and set `linkedRevisionSchedule`.* Knowledge is **linked** (not
force-created) because notebook entries require a real library Problem, which a
contest problem isn't — the topic still enters the revision→retention loop, which
is how CP-OS tracks knowledge health. No Problem reference is faked.

---

## 6. API Documentation

Standard envelope; `userId` server-derived; ids `assertObjectId`-guarded.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/contests/:id/learning` | full learning workspace |
| GET \| POST \| PATCH | `/api/contests/:id/postmortem` | read · upsert reflection |
| POST | `/api/contests/:id/upsolve` | body `{contestProblemRef}` → one task; empty → generate all |
| GET | `/api/upsolve` | all tasks (`?status`, `?priority`, `?contestId`) |
| GET | `/api/upsolve/queue` | grouped queue + counts + est. remaining |
| GET \| PATCH | `/api/upsolve/:id` | one task · update/**complete** (syncs) |

---

## 7. Component Hierarchy

```
ContestLearningPage (primary post-contest screen)
├── ContestLearningSummary
├── Reflection: ContestReflectionCard ⇄ PostmortemEditor (markdown textareas)
│      └── StrengthCard · WeaknessCard
├── main: UpsolveQueue → UpsolveTaskCard (start/complete/open/notebook) · PatternGapCard
└── rail: LearningGoalCard · AlgorithmGapCard · KnowledgeIntegrationCard

UpsolveQueuePage → counts + UpsolveQueue (global backlog)
```

Pattern/algorithm cards reuse Module-4 `SEVERITY_META`; upsolve completion is a
React Query mutation (server does the sync) that invalidates the workspace +
dashboard. Redux holds UI only (reflection-editing flag, upsolve filter).

---

## 8. The Contest Learning Workspace (description)

Reached from the workspace/detail via **Reflect & Upsolve**. It opens with a
three-tile summary (reflection written? · upsolve pending · goals), then the
**Reflection**: a read card (overall performance + what-went-well/wrong, biggest
mistake/learning, next focus, strength/weakness chips) that flips to a structured
**editor** (markdown textareas + newline lists) on Edit. Below, a two-column body:
the **Upsolve Queue** (priority-bordered task cards with Start/Complete and
Open/Notebook actions, a completed drawer, and a **Generate** button) beside a
**Pattern Analysis** card (solved vs missed pattern chips + "to practice" from
Pattern Intelligence); and a rail with **Learning Goals** (tracked + suggested),
**Algorithm Gaps** (severity-ranked, topic-linked) and a **Knowledge
Integration** card explaining and surfacing the mastery/revision/notebook links a
completed upsolve creates. A global **Upsolve Queue** page aggregates the backlog
across contests; the Home dashboard shows a pending-upsolve nudge. Dark-theme,
responsive, skeletons + empty states throughout.

---

## 9. Extension Points for Sprint 4 (Contest Intelligence & Performance Analytics)

- **Postmortem + upsolve data** is the raw material Sprint-4 analytics will
  aggregate (already persisted, per-contest and cross-contest via `/upsolve`).
- **Pattern/algorithm analysis** already flows through Module-4 Pattern
  Intelligence, so contest-level intelligence composes on top with no refactor.
- **Activity vocabulary** (`contest-reflected`, `upsolve-*`, `learning-goal-*`)
  gives the analytics a ready event stream.
- **UpsolveTask links** (mastery/revision/knowledge) let Sprint 4 measure
  learning outcomes per contest without new plumbing.
- Learning routes/components are additive; Sprint-4 pages slot in cleanly.

---

## Verification

- **Backend** `tsc` → clean; **frontend** `tsc` + `vite build` → clean (learning
  pages code-split; main bundle ~852 KB).
- **Smoke** (`npm run test:smoke`) → `✅ ALL ASSERTIONS PASSED`, incl. postmortem
  upsert + rule-based summary, upsolve auto-generation, and — critically — an
  **upsolve completion that raised mastery `86→88` (TopicProgressService) and
  linked a revision schedule (RevisionScheduleService)**, plus queue grouping, the
  learning-workspace aggregate (Pattern Intelligence reused), the five learning
  activity events, and HTTP `200/201/400` coverage for every endpoint.
