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
│   ├── seed/            data.ts, seed.ts
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
List every topic. `meta: { count }`.

### `GET /api/topics/:topicId`
Single topic by id. `400` / `404` as above.

### Status codes

| Code | When |
|------|------|
| 200 | Success |
| 400 | Malformed ObjectId / validation error |
| 404 | Unknown route or missing resource |
| 500 | Unexpected server error (stack included in non-prod) |

---

## Progress placeholder

Every phase/roadmap response includes a `progress` object shaped for the future
mastery engine. In Sprint 1 all values are `0`; wiring the real calculation is a
Sprint 2+ change that **does not alter the API contract**.
