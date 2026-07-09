# CP-OS — Competitive Programming Operating System

A personal learning operating system for Competitive Programming, DSA, Interview
Preparation and HFT preparation.

> **Module 1 · Sprint 1 — Learning Roadmap Foundation**
> This sprint implements the read-only **Roadmap → Phase → Topic** navigation that
> every future module builds on. Authentication, mastery, analytics, contests, AI,
> revision and problem-tracking are intentionally **out of scope**.

---

## Monorepo layout

```
CP_OS/
├── backend/     Node + Express + TypeScript + MongoDB (Mongoose)
└── frontend/    React 19 + Vite + TypeScript + Tailwind + shadcn/ui
```

Each package has its own README with architecture notes and API docs:

- [`backend/README.md`](./backend/README.md) — API documentation & backend architecture
- [`frontend/README.md`](./frontend/README.md) — frontend architecture & pages

---

## Quick start

### 1. Backend

```bash
cd backend
cp .env.example .env          # set MONGODB_URI
npm install
npm run seed                  # populate all 11 phases + topics
npm run dev                   # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env          # VITE_API_URL defaults to http://localhost:5000/api
npm install
npm run dev                   # http://localhost:5173
```

A MongoDB instance is required (local `mongod` or MongoDB Atlas). Set the
connection string in `backend/.env`.

---

## Sprint 1 deliverables

| # | Deliverable | Where |
|---|-------------|-------|
| 1 | Folder structure | this file + package READMEs |
| 2 | MongoDB schemas | `backend/src/models` |
| 3 | API documentation | `backend/README.md` |
| 4 | Seed script | `backend/src/seed` |
| 5 | Backend architecture | `backend/README.md` |
| 6 | Frontend architecture | `frontend/README.md` |
| 7 | Pages | `frontend/src/pages` |
| 8 | Assumptions | this file |
| 9 | Extension points | this file (see Sprint 3 section) |

---

## Assumptions

- **No auth in Sprint 1.** All data is global/single-user. A `userId` scope will
  be layered on in a later sprint without changing the roadmap hierarchy.
- **`isUnlocked` / `isCompleted`** are stored on the documents and seeded as static
  values (Phase 0 & 1 unlocked, rest locked). Real unlocking logic (based on
  mastery/progress) arrives in a later sprint — the fields already exist so no
  migration is needed.
- **Progress is a placeholder** (`0`). The API returns a `progress` field shaped
  for the real calculation so the frontend contract never changes.
- **MongoDB connection** is configured via `MONGODB_URI`; there is no bundled DB.

---

## Sprint 2 — Topic Workspace & Pattern Ladder ✅

Sprint 2 turned the Topic page into the primary **study workspace** (UI + data
structure only — no mastery, unlock, revision, tracker, analytics or AI).

- **Topic model extended** (`backend/src/models/Topic.ts`): `coreIdea`, when-to /
  when-not, time/space complexity, `advantages`, `limitations`, `applications`,
  `examples`, `recognitionKeywords`, `prerequisites`, `relatedTopics`,
  `representativeProblems`.
- **New read-only endpoints**: `GET /topics/:id` (full workspace detail with phase
  ref + prev/next navigation), `GET /topics/:id/related`, `GET /topics/:id/problems`.
- **Seed content** (`backend/src/seed/content.ts`): authored content for flagship
  topics + a derivation layer so **every** topic has a complete workspace.
- **Workspace UI** (`frontend/src/components/topic`): TopicHeader, ConceptCard,
  KeywordChip, PatternLadder + PatternStageCard, PatternCard, MetadataPanel,
  EstimatedTimeCard, LearningResourceCard, RepresentativeProblemTable,
  AssessmentCard, NotebookCard, TopicNavigation (with ← → keyboard nav).

### Sprint 2 assumptions

- **Pattern Ladder** state (locked/progress) and **current stage** are placeholders;
  real per-user progression is Sprint 3. The 6-stage structure is a shared constant.
- **PatternCard** is derived from the topic (no separate `Pattern` entity yet); the
  real entity slots in during Sprint 3.
- **Prerequisites / related topics** are stored as slugs and resolved server-side, so
  seeding never depends on generated ObjectIds.
- **Representative problems** are embedded on the topic and served read-only — this is
  deliberately **not** the Problem Tracker.

---

## Sprint 3 — Mastery Engine, Progress Engine & Topic Unlock ✅

Sprint 3 makes CP-OS mastery-driven. Progress is measured by **mastery**
(Recognition → Implementation → Variants → Contest → Assessment → Confidence),
never by problems solved. Single-user (`DEMO_USER_ID`) until auth lands.

- **New models**: `TopicProgress` (8 weighted metric scores + derived
  mastery/status/stage) and `LearningState` (current pointer). Phase/Topic gained
  an optional `masteryThreshold` override.
- **Isolated services**: `MasteryService` (pure maths), `UnlockService` (sole owner
  of the unlock rule), `ProgressService` (overlays + phase completion),
  `RecommendationService` (rule-based, no AI), `LearningStateService`,
  `TopicProgressService`. Repositories keep all Mongo access out of services.
- **New APIs**: `GET /learning/state`, `GET /progress`, `GET /recommendation`,
  `GET /topics/unlocked`, `GET|PATCH /topics/:id/progress`,
  `GET|PATCH /topics/:id/mastery`, `POST /topics/:id/unlock`.
- **Live UI**: dashboard (current phase/topic, mastery ring, recommendation,
  completed/remaining/confidence), roadmap & phase overlays (completed / current /
  locked / unlocked + mastery), topic workspace (mastery, current stage, ladder
  progress, recommendation). New reusable components: `MasteryRing`, `MasteryBar`,
  `StageProgress`, `LearningRecommendationCard`, `ProgressOverviewCard`,
  `CompletionBadge`, `UnlockBadge`, `CurrentTopicCard`, `RoadmapProgressCard`.
- **Seed feels alive**: Phase 0 mastered, Phase 1 in progress, current topic
  Sliding Window ~67% (assessment pending), rest locked.

### Mastery weights (configurable in `backend/src/config/mastery.ts`)

| Recognition | Implementation | Standard | Variant | Mixed | Contest | Assessment | Confidence |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 20% | 20% | 15% | 15% | 10% | 10% | 5% | 5% |

### Sprint 3 assumptions

- **Single demo user** (`DEMO_USER_ID`); `currentUserId()` is the one seam auth
  will change. All progress is already keyed by `userId`.
- **Mastery is always recomputed** from metrics on read; the stored `overallMastery`
  is a cache. Weights/thresholds are config, not hard-coded in services.
- **Pattern Ladder stages = the six problem-type metrics**; stage progress/lock is
  now real (derived from those metrics), replacing the Sprint 2 placeholder.
- **Phase completion is derived** per user (not stored on the global Phase).
- **Redux slices** (`learning`, `mastery`, `recommendation`, `progressUi`) hold only
  UI state; all server data stays in React Query.

---

## Extension points for Sprint 4

- **Auth / multi-user**: every progress record is keyed by `userId` and resolved
  through `currentUserId()` — the single seam to replace with real auth.
- **Dashboard refinement (Sprint 4)**: `GET /learning/state`, `GET /progress` and
  `GET /recommendation` already return everything the dashboard needs; the reusable
  learning components (`MasteryRing`, `ProgressOverviewCard`, …) are built to be
  reused in Analytics.
- **Assessments / problem attempts**: PATCH `assessment` / metric endpoints and the
  `TopicProgress` model are ready for real assessment and attempt feeds to drive.
- **Revision engine**: `TopicProgress.lastStudied` + per-stage timestamps are the
  hooks a spaced-revision scheduler will read.
- **Configurable mastery**: weights/thresholds live in `config/mastery.ts` and every
  service accepts overrides — per-user or per-track tuning is a config change.
- **Pattern / Problem models**: still slot under `Topic`; the representative-problem
  subdocs and derived `PatternCard` show the target shape.
