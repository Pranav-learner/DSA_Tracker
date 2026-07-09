# Module 2 · Sprint 3 — Pattern Notebook & Knowledge Management Engine

Turns solved problems into a structured, searchable **knowledge base** (the
learner's "second brain"). Every problem can become a permanent notebook entry —
why the pattern was recognised, the key observation, core algorithm, complexities,
alternatives, mistakes, lessons — plus explicit **relationships** to related
problems and other entries, laying the groundwork for a Knowledge Graph.

Out of scope by design (later modules): AI analysis, revision scheduling, graph
visualization, analytics, automatic confidence calculation. Confidence is tracked
but never auto-computed; a **placeholder hook** exposes it to Module 1.

---

## 1. Updated Folder Structure

`＋` new · `~` extended.

```
backend/src/
├── models/NotebookEntry.ts                ＋ structured entry + relationships + revisions
├── repositories/notebook.repository.ts    ＋ CRUD + search + relationship cleanup
├── services/
│   ├── notebook.service.ts                ＋ CRUD + search + relations + facets (business logic)
│   ├── notebook.dto.ts                    ＋ list/detail/refs/facets/query DTOs
│   ├── notebookIntegration.ts             ＋ modular seam: activity + confidence hook
│   └── masteryHooks.ts                    ~ + onNotebookConfidence placeholder
├── validators/notebook.validator.ts       ＋ zod create/update/query (confidence, relations…)
├── controllers/notebook.controller.ts     ＋ POST/GET/GET:id/PATCH/DELETE/search/facets
├── routes/notebook.routes.ts              ＋ /api/notebook  (+ registered in index.ts)
├── repositories/problem.repository.ts     ~ + findByIds() (relationship expansion)
├── types/domain.ts                        ~ notebook activity types
├── seed/notebook.ts + seed.ts             ＋/~ curated entries + knowledge chain
└── tests/roadmap.integration.ts           ~ notebook lifecycle + HTTP assertions

frontend/src/
├── api/notebook.api.ts                    ＋ list/search/facets/getById/create/update/remove
├── hooks/useNotebook.ts                   ＋ list/entry/facets/by-problem + mutations
├── store/slices/notebookSlice.ts          ＋ search/filters/sort/pagination (UI state)
├── components/notebook/                    ＋ the notebook component set (12) + reused KeywordChip
├── components/common/Modal.tsx             (reused from Sprint 2)
├── pages/
│   ├── NotebookListPage.tsx               ＋ searchable index
│   └── NotebookWorkspacePage.tsx          ＋ full workspace + inline editor
├── pages/ProblemDetailPage.tsx            ~ real notebook entry point (create / open)
├── components/dashboard/ActivityTimeline.tsx  ~ icons for the 3 new events
├── lib/queryClient.ts / types/index.ts / store/index.ts / router / Sidebar  ~
```

Reused (not duplicated): `KeywordChip` (existing topic component), `SearchBar` /
`Pagination` / `PlatformBadge` (problems), `DifficultyBadge`, `CardContainer`,
`Badge`, `Button`, `EmptyState`, `ErrorState`, `Skeleton`, mastery colour helpers,
`formatDateTime`/`relativeTime`, and the RHF+Zod pattern.

---

## 2. MongoDB Schema — NotebookEntry

| Field | Type | Notes |
|-------|------|-------|
| userId | string | indexed |
| problemId | ObjectId → Problem | indexed; **unique with userId** (no duplicates) |
| topicId / phaseId | ObjectId | topicId indexed |
| title / platform / pattern | string / enum / string | denormalised from the problem; pattern indexed |
| recognitionKeywords | string[] | doubles as tags for filtering |
| observation / coreAlgorithm | string | prose |
| timeComplexity / spaceComplexity | string | |
| alternativeSolutions | `{ title, detail }[]` | |
| commonMistakes | string[] | |
| lessonsLearned / personalNotes | string | |
| confidence | number (0–100) | tracked, never auto-calculated |
| relatedProblems | ObjectId[] → Problem | knowledge relationship |
| relatedEntries | ObjectId[] → NotebookEntry | knowledge relationship |
| revisionDates | Date[] | review timestamps |
| lastReviewedAt | Date \| null | |
| createdAt / updatedAt | Date | timestamps |

Indexes: `userId`, `problemId`, `pattern`, `topicId`, unique `{userId, problemId}`,
`{userId, updatedAt}`.

---

## 3. API Documentation

Standard `{ success, data }` envelope; user via `currentUserId`; ownership enforced
in the service (403 on mismatch).

| Method & path | Purpose |
|---|---|
| `POST /api/notebook` | Create an entry (problemId required; rest pre-filled from the problem). `409` on duplicate. |
| `GET /api/notebook` | Paginated, filterable index (returns the paginated envelope as `data`). |
| `GET /api/notebook/search` | Same contract, geared around `q`. |
| `GET /api/notebook/facets` | `{ patterns, platforms }` for data-driven filters. |
| `GET /api/notebook/:id` | Full entry with **resolved** topic/phase refs + related problems + related entries. |
| `PATCH /api/notebook/:id` | Update content / relationships; `review: true` appends a revision. |
| `DELETE /api/notebook/:id` | Delete + unlink the id from other entries' `relatedEntries`. |

Query params (list/search): `page, pageSize, q, pattern, topic, phase, platform,
problem, tag, confidenceMin, confidenceMax, sort (recent|confidence|reviewed|alpha),
order`. **Validation:** confidence 0–100, required `problemId` on create, duplicate
guard, problem existence (404), ownership (403), relationship integrity (referenced
problems/entries must exist).

---

## 4. Notebook Architecture

```
controller → NotebookService (business logic) → repositories → models
                    │
                    ├── validate relations (problems + entries exist / owned)
                    ├── pre-fill identity from the Problem (title/pattern/platform/topic/phase)
                    ├── toDetail() → resolve topic/phase + related problems (+ topic titles) + related entries
                    └── notebookIntegration (modular side-effects)
                             ├── activityService.record → dashboard timeline
                             └── masteryHooks.onNotebookConfidence → Module 1 (placeholder)
```

- **NotebookService** owns all logic: duplicate guard, identity pre-fill,
  relationship validation/integrity, search/filter/sort/pagination, facets, and the
  `toDetail` relationship expansion (batch-resolving topic titles to avoid N+1).
- **NotebookIntegration** keeps the service free of cross-module concerns; effects
  are best-effort so they never break the write.
- **masteryHooks.onNotebookConfidence** is the documented seam that exposes
  confidence to Module 1 **without** recalculating mastery this sprint.
- Frontend: server state in React Query (`useNotebook*`); UI state (search/filters/
  sort/page) in the `notebook` Redux slice; the workspace editor auto-saves.

---

## 5. Search Implementation

- **Full-text** — an escaped, case-insensitive regex `$or` across `title`,
  `pattern`, `observation`, `coreAlgorithm`, `lessonsLearned`, `recognitionKeywords`
  (partial matches; fine at notebook scale).
- **Filters** map straight to the Mongo query: `pattern`, `topicId`, `phaseId`,
  `platform`, `problemId`, `tag` (matches a `recognitionKeywords` element), and a
  `confidence` range (`$gte`/`$lte`). All scoped by `userId`.
- **Sort** — `recent`→updatedAt, `confidence`→confidence, `reviewed`→lastReviewedAt,
  `alpha`→title, with a title tiebreak; asc/desc.
- **Pagination** — `skip/limit` + parallel `countDocuments`; the client keeps the
  previous page visible (`keepPreviousData`) and debounces the search box (300ms).

---

## 6. Knowledge Relationship Model

Every entry stores **two** id-reference arrays — `relatedProblems` (→ Problem) and
`relatedEntries` (→ NotebookEntry) — so a chain like

```
Prefix Sum → Difference Array → Fenwick Tree → Segment Tree
```

is expressible directly (the seed wires exactly this). On read, ids are expanded
into rich refs (related problems carry difficulty + topic title; related entries
carry pattern + confidence). Integrity is enforced on write (targets must exist /
be owned) and on delete (the id is pulled from every other entry's `relatedEntries`).
Because relationships are plain id references with no computed coupling, **Module 4
can build the Knowledge Graph with no schema change** — it only needs to read these
arrays.

---

## 7. Screens (described)

**Notebook List** (`/notebook`) — `SectionHeader`, a debounced `NotebookSearch`, a
sort dropdown (Recently Updated / Highest Confidence / Recently Reviewed /
Alphabetical), a data-driven `NotebookFilters` panel (pattern / platform / phase /
topic / min-confidence + reset), and a responsive grid of `NotebookCard`s (title,
pattern, topic, confidence meter, revision + link counts, "updated Xd ago").
Skeletons, empty states (empty vs no-match), pagination.

**Notebook Workspace** (`/notebook/:id`) — `NotebookHeader` (title, pattern,
platform, phase, topic link, "Open problem", Edit toggle). Read mode: a two-column
layout — main column has Recognition Keywords (`KeywordChip`), Observation, Core
Algorithm, Complexities (`ComplexityCard`), Alternative Solutions, Common Mistakes
(`LessonCard`), Lessons Learned, Personal Notes, and Related Problems
(`RelatedProblemCard` grid → navigate to the problem); the aside has a Confidence
meter, `KnowledgeLinkCard` (related entries → navigate), `RevisionHistoryCard`
(timeline + "Mark reviewed") and Delete. Edit mode swaps in `NotebookEditor` — an
auto-saving React Hook Form + Zod form (all sections, a confidence slider, and a
dynamic alternative-solutions list), with a "Saving…/All changes saved" status in
the header.

**Problem Detail** — a Pattern Notebook card now offers "Document this problem"
(creates the entry, pre-filled from the problem, and opens the workspace) or "Open
notebook" with a confidence peek when one already exists.

All dark-theme, glass cards, framer motion, markdown-friendly (line-preserving)
prose, skeletons, empty states, responsive.

---

## 8. Extension Points Prepared for Sprint 4

- **Relationships are graph-ready** — `relatedProblems` + `relatedEntries` are plain
  id references, already resolved into rich refs on read; the Knowledge Graph reads
  them directly (no schema/refactor).
- **`masteryHooks.onNotebookConfidence`** is the wired seam to feed confidence into
  mastery when that sprint lands.
- **`notebookIntegration`** is the single place to add cross-module effects
  (revision prompts, AI mentor triggers) without touching the service.
- **Activity `notebook-created` / `notebook-updated` / `problem-documented`** are
  live end-to-end and on the dashboard timeline.
- **Search/facets + the `NotebookQuery` shape** already expose pattern/topic/
  confidence dimensions an analytics or recommendation engine can consume.
- Reusable component set (`ObservationCard`, `LessonCard`, `KnowledgeLinkCard`,
  `ConfidenceSlider`, `NotebookEditor`, …) is ready to host AI-generated content or
  a graph panel.

---

## Verification

- Backend `tsc` ✓ · Frontend `tsc` ✓ · `vite build` ✓
- Integration smoke test (`npm run test:smoke`, in-memory Mongo) — **all assertions
  pass**, including: create (pattern pre-filled "Hashing / Scan", related problem
  resolved with topic title), **duplicate rejection**, update + `review` (revision
  appended, lastReviewedAt set), related-entry linking, detail topic/phase
  resolution, list + pattern/confidence filters + full-text search + facets, the
  three activity events (created + documented + updated), **relationship integrity**
  (deleting an entry unlinks it from others), and the HTTP surface (`POST` 201;
  list/search/facets/get/patch/delete 200; missing problem 404; bad confidence 400).
- No local MongoDB was running, so `npm run seed` / the live app weren't executed
  here; the engine (including the seeded knowledge chain builder) is exercised by the
  in-memory smoke run. Run `npm run seed` once your DB is up.
