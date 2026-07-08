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
| 9 | Extension points for Sprint 2 | this file |

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

## Extension points for Sprint 2

- `Topic → Pattern → Problem` models slot under the existing `Topic` model using the
  same `phaseId`-style references.
- `progress` objects are already returned by every roadmap/phase endpoint — wire in
  the mastery engine without touching the frontend contract.
- Repositories isolate all Mongo access, so per-user scoping is a repository-layer
  change only.
- Redux slices (`roadmap`, `phase`, `topic`) hold UI state and are ready for
  filters, search and selection state.
- Topic page already renders placeholder cards for Concept, Pattern Ladder,
  Problems, Assessment, Notebook and Mastery — each becomes a Sprint 2+ feature.
