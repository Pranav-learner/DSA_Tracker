# Module 2 · Sprint 1 — Problem Library

The Problem Library is the central, **read-only** catalog of DSA / CP problems. It
adds a standalone `Problem` collection (+ per-user `UserProblem` overlay), a fully
filterable/searchable/paginated API, and the Problems + Problem Detail pages.

It is built as a clean extension of the existing architecture (same layering,
envelope, design system) and introduces **no** attempt tracking, notebook,
mistakes, confidence, revision, analytics or AI — those are later sprints. The
Module 1 topic workspace (its embedded `representativeProblems` and
`GET /api/topics/:id/problems`) is left **untouched**; the library is a parallel,
richer system that a later sprint can fully unify.

---

## 1. Updated Folder Structure

`＋` new · `~` extended.

```
backend/src/
├── models/
│   ├── Problem.ts                    ＋ catalog entry (shared, immutable per user)
│   └── UserProblem.ts                ＋ per-user status / favorite / lastViewed
├── repositories/
│   ├── problem.repository.ts         ＋ search (find+count), facets, seed ops
│   └── userProblem.repository.ts     ＋ overlay reads + id-by-state (for filters)
├── services/
│   ├── problem.service.ts            ＋ list / getById / facets (filters+sort+page+overlay)
│   └── problem.dto.ts                ＋ list/detail/paginated/facets/query DTOs
├── validators/
│   └── problemQuery.validator.ts     ＋ zod coercion + bounds for the query string
├── controllers/
│   └── problem.controller.ts         ＋ GET /problems, /search, /facets, /:id
├── routes/
│   ├── problem.routes.ts             ＋
│   └── index.ts                      ~ mounts /problems + endpoint doc
├── seed/
│   ├── problems.ts                   ＋ builder + curated extras + demo-state lists
│   └── seed.ts                       ~ seedProblems() + seedUserProblems()
├── types/domain.ts                   ~ PROBLEM_STATUSES + difficultyRank()
└── tests/roadmap.integration.ts      ~ library seed + service + HTTP assertions

frontend/src/
├── api/problem.api.ts                ＋ list / search / getById / facets (+ query serialiser)
├── hooks/
│   ├── useProblems.ts                ＋ useProblems / useProblem / useProblemFacets
│   └── useDebouncedValue.ts          ＋ generic debounce (for SearchBar)
├── store/slices/problemsSlice.ts     ＋ filters / search / sort / view / pagination (UI state)
├── components/problems/              ＋ the reusable library component set
│   ├── ProblemTable.tsx  ProblemCard.tsx  ProblemHeader.tsx
│   ├── SearchBar.tsx  FilterPanel.tsx  Pagination.tsx
│   ├── PlatformBadge.tsx  ProblemStatusBadge.tsx  TagChip.tsx
│   ├── FavoriteButton.tsx  PlaceholderCard.tsx  index.ts
├── pages/
│   ├── ProblemsPage.tsx              ＋ catalog (search + filters + table/grid + pagination)
│   └── ProblemDetailPage.tsx         ＋ detail + future-feature placeholders
├── lib/queryClient.ts                ~ problem query keys
├── store/index.ts                    ~ registers `problems` slice
├── router/index.tsx                  ~ /problems and /problems/:id
├── components/layout/Sidebar.tsx     ~ live "Problems" nav item
└── types/index.ts                    ~ Problem* types
```

Reused (not duplicated): `DifficultyBadge`, `EmptyState`, `ErrorState`,
`LoadingSkeleton`, `CardContainer`, `Badge`, `Button`, `Skeleton`, `SectionHeader`,
`Breadcrumb`, `Icon`, `apiGet`, `ApiResponse.ok`, `ApiError`, `asyncHandler`,
`currentUserId`, `assertObjectId`, `toPhaseRefDTO`.

---

## 2. MongoDB Schemas

### Problem (shared catalog)

| Field | Type | Notes |
|-------|------|-------|
| title | string | |
| slug | string | unique, lowercase |
| platform | enum(PLATFORMS) | indexed |
| platformProblemId | string | derived from the URL's last path segment |
| url | string | |
| difficulty | enum(DIFFICULTIES) | indexed |
| difficultyRank | number | denormalised 0–4 for correct difficulty ordering |
| phaseId | ObjectId → Phase | indexed |
| topicId | ObjectId → Topic | indexed |
| pattern | string | indexed |
| tags | string[] | |
| editorialUrl | string? | |
| representative | boolean | indexed |
| estimatedSolveTime | number | minutes |
| createdAt / updatedAt | Date | timestamps |

Indexes: `slug` (unique), `platform`, `difficulty`, `phaseId`, `topicId`,
`pattern`, `representative`, compound `{ topicId, difficultyRank }`.

### UserProblem (per-user overlay)

| Field | Type | Notes |
|-------|------|-------|
| userId | string | indexed |
| problemId | ObjectId → Problem | indexed |
| status | enum('Not Started','In Progress','Solved') | |
| favorite | boolean | |
| lastViewed | Date \| null | |
| createdAt / updatedAt | Date | timestamps |

Indexes: unique `{ userId, problemId }`, `{ userId, status }`, `{ userId, favorite }`.
Kept separate from `Problem` so the catalog stays shared/immutable; this is where
Attempt Tracking (Sprint 2) will write.

Both use the project's standard `toJSON` transform (`_id` → `id`, no `__v`).

---

## 3. Seed Script

`npm run seed` now also builds the library (`seed/problems.ts` → `buildProblemSeed`):

1. **Representative problems (~177)** — flattened from every topic's curated
   `representativeProblems` (≈3 × 59 topics), marked `representative: true`. Real,
   well-known problems for the 10 flagship topics; structured entries elsewhere.
   Every one resolves to a real `phaseId`/`topicId`, so the catalog is organised
   across all 11 phases and 59 topics.
2. **Curated extras (21)** — hand-picked famous problems, `representative: false`,
   so the `representative` filter is meaningful and the **Greedy** pattern (which
   has no dedicated topic) is covered by hosting it on *Sorting Algorithms*.

**Total: 198 problems** (within the 150–200 target). Slugs are de-duplicated;
`platformProblemId` is derived from the URL. Coverage spans Arrays, Sliding Window,
Prefix Sum, Binary Search, Trees, Graphs, DP, Greedy, Strings and Math.

`seedUserProblems()` seeds the demo user's realistic state: problems in completed
topics → **Solved**, current topic (*Sliding Window*) → **In Progress**, and a set
of famous problems favourited. Only non-default overlays are persisted.

---

## 4. API Documentation

All responses use the standard `{ success, data }` envelope. User is resolved via
`currentUserId` (single-user for now).

### `GET /api/problems`  ·  `GET /api/problems/search`
Paginated, filterable, sortable listing. `/search` is the same contract, geared
around `q`. The **whole paginated object is returned as `data`** (so one client
unwrap yields items + pagination):

```jsonc
data: {
  items: ProblemListItem[],
  page, pageSize, total, totalPages, hasNext, hasPrev
}
```

Query params (all optional, coerced + bounded by zod):

| Param | Values | |
|-------|--------|--|
| `page` | int ≥ 1 (default 1) | invalid → 1 |
| `pageSize` | 1–100 (default 20) | |
| `q` | string | matches title / pattern / tags / platformProblemId (case-insensitive) |
| `platform` | enum | |
| `difficulty` | enum | |
| `phase` | ObjectId | |
| `topic` | ObjectId | topic-scoped listing lives here |
| `pattern` | string | |
| `status` | Not Started \| In Progress \| Solved | resolved via UserProblem |
| `representative` | boolean | |
| `favorite` | boolean | resolved via UserProblem |
| `sort` | difficulty \| title \| estimatedSolveTime \| platform \| recent | default `difficulty` |
| `order` | asc \| desc | default `asc` |

### `GET /api/problems/:id`
Full `ProblemDetail` — the list item plus resolved `topic` + `phase` refs,
`lastViewed`, and timestamps. `400` on a malformed id, `404` if not found.

### `GET /api/problems/facets`
`{ platforms, difficulties, patterns, statuses }` — powers the data-driven
FilterPanel (patterns are the catalog's distinct values).

> The Module 1 `GET /api/topics/:topicId/problems` (embedded representative
> problems for the topic workspace) is unchanged. The library's topic-scoped
> listing is `GET /api/problems?topic=:id`.

---

## 5. Search / Filter / Sort / Pagination Implementation

- **Search** — a case-insensitive, escaped regex `$or` across `title`, `pattern`,
  `tags`, `platformProblemId`. Regex (not `$text`) gives partial matches ("slid" →
  "Sliding"), which reads better in a live search box (fine at catalog scale).
- **Filtering** — catalog fields (`platform`, `difficulty`, `phaseId`, `topicId`,
  `pattern`, `representative`) map straight to the Mongo filter. `status` and
  `favorite` live on `UserProblem`, so the service pre-resolves the matching
  problem-id set and injects an `_id ∈ / ∉` constraint (`Not Started` = "not in the
  In-Progress/Solved set"). All constraints combine with `$and`.
- **Sorting** — the API field maps to a document field; `difficulty` sorts by the
  denormalised numeric `difficultyRank` (so Easy < Medium < Hard, not alphabetical),
  with `title` as a stable tiebreak.
- **Pagination** — `skip/limit` + a parallel `countDocuments`; the service returns
  `page, pageSize, total, totalPages, hasNext, hasPrev`.
- **Overlay** — after fetching a page, the user's `UserProblem` rows for those ids
  are loaded once and merged in (status/favorite), defaulting cleanly.
- **Client** — filters/search/sort/view/page live in the `problems` Redux slice;
  `useProblems` builds the query from it. React Query caches per-query and
  `keepPreviousData` keeps the current page visible while the next loads. The
  SearchBar debounces (300ms) so typing doesn't fire a request per keystroke.

---

## 6. Screens (described)

**Problems page** (`/problems`)
- `SectionHeader` ("Problem Library"), then a toolbar: debounced `SearchBar`
  (title/pattern/tag), a sort dropdown (Difficulty ↑/↓, Title A–Z/Z–A, Quickest,
  Longest, Platform, Recently added), and a Table/Grid view toggle.
- `FilterPanel` — data-driven selects (Platform, Difficulty, Status, Phase, Topic,
  Pattern) plus "Representative only" / "Favorites only" chips, an active-filter
  count and Reset. Topic options load from the selected phase.
- Results as a dense **ProblemTable** (favorite · title (representative ★) · platform ·
  difficulty · pattern · status · est · chevron) or a **ProblemCard** grid. Rows/cards
  open the detail. Loading skeletons, an empty state ("No problems match your
  filters"), and an error state with retry.
- **Pagination** with a windowed page list and a "Showing X–Y of N" summary.

**Problem Detail page** (`/problems/:id`)
- Breadcrumb → `ProblemHeader`: title, pattern, difficulty + platform + status
  badges, estimated solve time, phase/topic context (topic links to the workspace),
  tags, and "Solve on {platform}" / "Editorial" buttons.
- A "Your Workspace" row of four **PlaceholderCard**s (Attempts, Notebook, Mistakes,
  Confidence), each marked *Coming soon* — the future layout, visible now.

All dark-theme, glass cards (`bg-card/60 backdrop-blur`), rounded, framer entrance/
hover, `tabular-nums`, responsive (toolbar stacks, grids collapse, table scrolls).

---

## 7. Extension Points Prepared for Sprint 2 (Attempt Tracking)

- **`UserProblem` is the write target.** Its shape (status/favorite/lastViewed +
  timestamps) already backs the read overlay; Sprint 2 adds `PATCH` endpoints and
  a repository `upsert` (already present) — no schema change.
- **FavoriteButton / status** are display-only now by design; they become
  interactive the moment UserProblem mutations land (the components already take
  the state as a prop).
- **Attempt / Notebook / Mistake / Confidence** each get a model + service and slot
  into the detail page's existing placeholder grid (`PlaceholderCard` → real card).
- **`activityService.record`** (Module 1) is ready to log problem events
  (`entityType: 'problem'`) onto the dashboard timeline.
- **`PaginatedDTO<T>` + the query/validator pattern** are generic and reusable for
  any future library-style list (attempts, submissions).
- **Single-user → multi-user** stays a `currentUserId` change; every layer threads
  `userId` already.

---

## Verification

- Backend `tsc` ✓ · Frontend `tsc` ✓ · `vite build` ✓
- Integration smoke test (`npm run test:smoke`, in-memory Mongo) — **all assertions
  pass**, including: 198 problems seeded (10 pages), facets (82 patterns / 7
  platforms), topic/status/favorite/representative filters, `q` search across
  title/pattern/tags, ascending title sort, difficulty-rank ordering, detail
  topic/phase refs, Greedy coverage, and HTTP `GET /problems` `/search` `/facets`
  `/:id` (200), invalid id (400), missing (404), coerced bad page (200).
- No local MongoDB was running, so the live `npm run seed` wasn't executed here;
  the seed builder + user-state seeding are exercised by the smoke test's in-memory
  run. Run `npm run seed` once your DB is up.
