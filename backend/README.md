# CP-OS Backend — Learning Roadmap API

Node · Express · TypeScript · MongoDB (Mongoose). Sprint 1 is **read-only**:
it serves the `Roadmap → Phase → Topic` hierarchy.

---

## Architecture

A strict, one-directional layered architecture. **Controllers never touch
MongoDB** — every DB operation lives in a repository.

```
HTTP Request
   │
   ▼
routes/          Map URLs → controllers
   │
   ▼
controllers/     Parse & validate the request, shape the HTTP response
   │
   ▼
services/        Business logic, aggregation, DTO mapping
   │
   ▼
repositories/    The ONLY place Mongoose/MongoDB is used
   │
   ▼
models/          Mongoose schemas (Phase, Topic)
```

Cross-cutting concerns:

| Folder | Responsibility |
|--------|----------------|
| `config/` | `env` (validated config), `db` (connection lifecycle) |
| `middlewares/` | `notFound`, centralised `errorHandler` |
| `validators/` | `assertObjectId` — reject malformed ids with 400 |
| `utils/` | `ApiError`, `ApiResponse` (`ok`), `asyncHandler`, `slugify`, `logger` |
| `types/` | shared domain types (`Difficulty`, `Progress`) |
| `seed/` | roadmap seed data + runnable seed script |

### Why this shape

- **Testable** — `createApp()` has no side effects; services depend on repository
  interfaces, so each layer can be tested in isolation.
- **Swappable persistence** — the entire Mongo surface is behind two repository
  objects. Per-user scoping (a later sprint) is a repository-only change.
- **Consistent contracts** — every success response is `{ success, data, meta? }`;
  every error is `{ success: false, error: { message, statusCode, details? } }`.

---

## Folder structure

```
backend/
├── src/
│   ├── config/          env.ts, db.ts
│   ├── controllers/     roadmap, phase, topic
│   ├── services/        roadmap, phase, topic, mappers (DTOs)
│   ├── repositories/    phase.repository, topic.repository
│   ├── models/          Phase.ts, Topic.ts
│   ├── routes/          index.ts + per-feature routers
│   ├── middlewares/     notFound.ts, errorHandler.ts
│   ├── validators/      objectId.validator.ts
│   ├── utils/           ApiError, ApiResponse, asyncHandler, slugify, logger
│   ├── types/           domain.ts
│   ├── seed/            data.ts, content.ts (Sprint 2 study content), seed.ts
│   ├── app.ts           Express app factory
│   └── index.ts         Bootstrap (connect DB + listen + graceful shutdown)
├── .env.example
├── tsconfig.json
└── package.json
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with hot reload (tsx watch) |
| `npm run seed` | Wipe & repopulate all 11 phases + topics |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled server |
| `npm run typecheck` | Type-check without emitting |

---

## Data models

### Phase

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | required |
| `slug` | string | unique, generated from title |
| `order` | number | unique, 0–10 |
| `description` | string | |
| `icon` | string | lucide-react icon name |
| `estimatedWeeks` | number | |
| `estimatedProblems` | number | derived from topics at seed time |
| `color` | string | hex accent |
| `isUnlocked` | boolean | Phase 0 & 1 unlocked in seed |
| `isCompleted` | boolean | |
| `createdAt` / `updatedAt` | Date | timestamps |

Virtual: `topics` (populate `Topic.phaseId`).

### Topic

| Field | Type | Notes |
|-------|------|-------|
| `phaseId` | ObjectId → Phase | required, indexed |
| `title` | string | required |
| `slug` | string | unique **within a phase** (`{phaseId, slug}`) |
| `description` | string | |
| `order` | number | position within the phase |
| `estimatedHours` | number | |
| `estimatedProblems` | number | |
| `difficulty` | enum | `Beginner \| Easy \| Medium \| Hard \| Expert` |
| `isUnlocked` | boolean | |
| `isCompleted` | boolean | |
| `createdAt` / `updatedAt` | Date | timestamps |
| **— Sprint 2 concept fields —** | | |
| `coreIdea` | string | the central idea of the topic |
| `whenToUse` / `whenNotToUse` | string | applicability guidance |
| `timeComplexity` / `spaceComplexity` | string | complexity summary |
| `advantages` / `limitations` / `applications` | string[] | bullet content |
| `examples` | `{ title, detail }[]` | worked examples |
| **— Sprint 2 relations & recognition —** | | |
| `recognitionKeywords` | string[] | statement hints |
| `prerequisites` | string[] | topic **slugs** (resolved via `/related`) |
| `relatedTopics` | string[] | topic **slugs** (resolved via `/related`) |
| **— Sprint 2 read-only problems —** | | |
| `representativeProblems` | subdoc[] | `{ name, platform, difficulty, pattern, url?, estimatedMinutes }` |

> All Sprint 2 fields default to empty, so pre-existing documents stay valid.
> Relations are stored as slugs (stable, seed-friendly) and resolved to topic
> summaries by the `/related` endpoint.

---

## API documentation

Base URL: `http://localhost:5000`. All payloads are JSON.

Success envelope: `{ "success": true, "data": <T>, "meta"?: {...} }`
Error envelope:   `{ "success": false, "error": { "message", "statusCode", "details"? } }`

### `GET /health`
Liveness probe → `{ status: "ok", uptime }`.

### `GET /api/roadmap`
The full roadmap in one call (used by the Roadmap page & Dashboard).

```jsonc
{
  "success": true,
  "data": {
    "phases": [ { /* PhaseDTO with topicCount + progress */ } ],
    "stats": {
      "totalPhases": 11,
      "unlockedPhases": 2,
      "completedPhases": 0,
      "totalTopics": 57,
      "totalEstimatedWeeks": 44,
      "totalEstimatedProblems": 560
    },
    "progress": { "completedTopics": 0, "totalTopics": 57, "completedProblems": 0, "totalProblems": 560, "percent": 0 }
  }
}
```

### `GET /api/phases`
List all phases (each with `topicCount` + `progress` placeholder).
`meta: { count }`.

### `GET /api/phases/:phaseId`
Single phase by id. `400` if id malformed, `404` if not found.

### `GET /api/phases/:phaseId/topics`
Topics belonging to a phase, ordered. `meta: { count, phaseId }`.

### `GET /api/topics`
List every topic (summary fields). `meta: { count }`.

### `GET /api/topics/:topicId`
Full **topic workspace detail**. `400` if id malformed, `404` if not found.

```jsonc
{
  "success": true,
  "data": {
    "id": "…", "title": "Sliding Window", "difficulty": "Medium",
    "estimatedHours": 6, "estimatedProblems": 16,
    "concept": {
      "coreIdea": "…", "whenToUse": "…", "whenNotToUse": "…",
      "timeComplexity": "O(n) …", "spaceComplexity": "O(1) …",
      "advantages": ["…"], "limitations": ["…"], "applications": ["…"],
      "examples": [{ "title": "…", "detail": "…" }]
    },
    "recognitionKeywords": ["contiguous subarray", "substring", "…"],
    "prerequisites": ["two-pointers"],       // slugs
    "relatedTopics": ["prefix-sum", "…"],     // slugs
    "representativeProblemCount": 3,
    "phase": { "id": "…", "title": "Arrays & Linear Patterns", "order": 1, "color": "#6366f1", "icon": "brackets" },
    "navigation": {
      "previous": { "id": "…", "title": "Two Pointers", "…": "…" },
      "next":     { "id": "…", "title": "Kadane's Algorithm", "…": "…" }
    }
  }
}
```

`navigation.previous/next` are derived from topic ordering within the phase.

### `GET /api/topics/:topicId/related`
Resolves `prerequisites` & `relatedTopics` slugs into topic summaries.
`meta: { prerequisiteCount, relatedCount }`.

```jsonc
{ "success": true, "data": { "prerequisites": [ /* TopicSummary[] */ ], "related": [ /* TopicSummary[] */ ] } }
```

### `GET /api/topics/:topicId/problems`
Read-only representative problems for a topic (NOT the problem tracker).
`meta: { count }`. Each item: `{ id, name, platform, difficulty, pattern, url?, estimatedMinutes, status: "Not Started" }`.

### Status codes

| Code | When |
|------|------|
| 200 | Success |
| 400 | Malformed ObjectId / validation error |
| 404 | Unknown route or missing resource |
| 423 | Topic is **locked** (unlock rule not satisfied) |
| 500 | Unexpected server error (stack included in non-prod) |

---

# Sprint 3 — Learning Engine

Sprint 3 adds the mastery-driven business logic. Progress is measured by mastery
(Recognition → Implementation → Variants → Contest → Assessment → Confidence),
**not** problems solved. Single-user for now (`DEMO_USER_ID`, default `demo-user`);
swapping to real auth is a repository-layer change only.

## New collections

### TopicProgress  (`{ userId, topicId }` unique)
The eight 0–100 metric scores are the source of truth: `recognitionScore`,
`implementationScore`, `standardScore`, `variantScore`, `mixedScore`,
`contestScore`, `assessmentScore`, `confidence`. Derived caches (written only by
the service layer): `overallMastery`, `assessmentPassed`, `currentStage`,
`status` (`Not Started | In Progress | Completed | Mastered`), plus
`startedAt/lastStudied/completedAt`.

### LearningState  (`userId` unique)
The "where am I" pointer: `currentPhaseId`, `currentTopicId`, `currentStage`,
`lastActiveAt`. Aggregates are computed, never stored.

Phase & Topic each gained an optional `masteryThreshold` override (falls back to
`config/mastery.ts`).

## Service layer

| Service | Responsibility |
|---------|----------------|
| `MasteryService` | **Pure** mastery maths — weighted overall, status, ladder, current stage. No DB. |
| `UnlockService` | Sole owner of the unlock rule + `unlockTopic` action. |
| `ProgressService` | Per-topic overlays, phase completion, overall aggregates. |
| `RecommendationService` | Rule-based next best action (no AI). |
| `LearningStateService` | Composes progress + recommendation for the dashboard. |
| `TopicProgressService` | Read/update a topic's progress; delegates all maths. |

Repositories `TopicProgressRepository`, `LearningRepository` and
`ProgressRepository` (a read-model composing the feature repos) keep **all**
Mongo access out of services.

### Mastery calculation

`overall = Σ metricᵢ × weightᵢ` (rounded). Default weights (configurable in
`config/mastery.ts`, sum = 1):

| Recognition | Implementation | Standard | Variant | Mixed | Contest | Assessment | Confidence |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 20% | 20% | 15% | 15% | 10% | 10% | 5% | 5% |

Status: `Mastered` if overall ≥ 90 **and** assessment passed; `Completed` if
overall ≥ 75 **and** assessment passed; `In Progress` if any metric > 0; else
`Not Started`. Mastery is always recomputed on read — the stored value is a cache.

### Unlock algorithm (UnlockService only)

A topic is unlocked when it is the **first of its phase**, OR the **previous topic**
is Completed/Mastered **AND** its mastery ≥ 70 **AND** its assessment passed.
`POST /topics/:id/unlock` validates this and returns **423** when locked.

### Progress / phase-completion engine

Per phase: `completionPercent = completed/total`, `mastery = avg(topic mastery)`,
`estimatedTimeSpent ≈ Σ hours × mastery`. A phase is `completed` when every topic
is done **and** average mastery ≥ threshold; `in-progress` if any topic started;
else `locked`.

## API documentation (Sprint 3)

Success/error envelopes as above. All routes are scoped to the current user.

### `GET /api/learning/state`
Composed dashboard state: `currentPhase`, `currentTopic`, `currentStage`,
`currentMastery`, `overall` aggregates, and `recommendation`.

### `GET /api/progress`
`{ overall, currentPhaseId, currentTopicId, currentStage, phases[], topics[] }` —
overall aggregates plus per-phase and per-topic overlays (status, mastery,
unlocked). Powers the roadmap/phase overlays and dashboard.

### `GET /api/recommendation`
The rule-based next action: `{ type, title, message, topicId, phaseId, actionLabel, actionTo }`.

### `GET /api/topics/unlocked`
Topic summaries currently unlocked for the user.

### `GET /api/topics/:id/progress`  ·  `PATCH …/progress`
Read / update a topic's progress. PATCH body is a partial of the 8 metrics
(0–100, strict); it recomputes mastery/status/stage and advances the pointer.
`423` if the topic is locked, `400` on invalid values.

### `GET /api/topics/:id/mastery`  ·  `PATCH …/mastery`
Mastery breakdown `{ overallMastery, status, metrics, weights, ladder }`; PATCH
updates the metric inputs behind it.

### `POST /api/topics/:id/unlock`
Unlock a topic (rule-checked). `423` when its requirements aren't met.

## Seed

`npm run seed` also seeds the demo user: Phase 0 fully **mastered**, Phase 1 in
progress with the current topic **Sliding Window** (~67%, assessment pending), the
rest locked — so the app feels alive on first run. Mastery/status are derived via
the MasteryService (never hard-coded twice).
